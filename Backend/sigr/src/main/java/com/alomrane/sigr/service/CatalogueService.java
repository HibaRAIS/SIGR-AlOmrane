package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.request.ProduitFormRequest;
import com.alomrane.sigr.dto.response.*;
import com.alomrane.sigr.model.*;
import com.alomrane.sigr.model.enums.StockStatus;
import com.alomrane.sigr.model.enums.TypeMouvement;
import com.alomrane.sigr.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service catalogue – gestion complète des produits, stocks, mouvements et cumuls.
 * <p>
 * Les cumuls affichés dans le détail sont ceux de <b>l'exercice comptable en cours</b>
 * (année civile). Ils sont calculés dynamiquement à partir du journal des mouvements
 * et repartent automatiquement à zéro chaque 1ᵉʳ janvier, sans intervention manuelle.
 * Cette approche garantit une clôture d'exercice naturelle et sans maintenance.
 * <p>
 * Le PMP est toujours recalculé par le backend (via {@link StockPhysique#recalculerPMP})
 * lorsqu'un prix d'achat explicite est fourni. Les ajustements manuels de stock
 * entraînent un mouvement de type AJUSTEMENT.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogueService {

    private final ProduitRepository produitRepository;
    private final StockPhysiqueRepository stockPhysiqueRepository;
    private final JournalMouvementRepository journalMouvementRepository;
    private final CategorieRepository categorieRepository;
    private final StructureRepository structureRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MouvementService mouvementService;

    // -------------------------------------------------------------------
    // CATALOGUE PAGINÉ AVEC FILTRES
    // -------------------------------------------------------------------
    @Transactional(readOnly = true)
    public Page<ProduitResumeResponse> getProduitsPage(Pageable pageable, String search, String category,
                                                       String location, String supplier, String status,
                                                       LocalDate dateDebut, LocalDate dateFin) {

        Specification<Produit> spec = null;
        if (search != null && !search.isEmpty()) {
            Specification<Produit> searchSpec = (root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("designation")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("codeArticle")), "%" + search.toLowerCase() + "%")
            );
            spec = searchSpec;
        }
        if (category != null && !category.equals("all")) {
            // Récupérer tous les noms de catégories descendantes (y compris la catégorie elle-même)
            Set<String> categoryNames = getDescendantCategoryNames(category);
            Specification<Produit> catSpec = (root, query, cb) ->
                    root.join("categorie").get("nom").in(categoryNames);
            spec = (spec == null) ? catSpec : spec.and(catSpec);
        }

        List<Produit> allMatching;
        if (spec != null) {
            allMatching = produitRepository.findAll(spec);
        } else {
            allMatching = produitRepository.findAll();
        }

        List<Produit> filtered = allMatching.stream()
                .filter(p -> {
                    StockPhysique stock = p.getStockPhysique();
                    if (location != null && !location.equals("all")) {
                        if (stock == null || !location.equals(stock.getEmplacementPrincipal())) return false;
                    }
                    if (status != null && !status.equals("all")) {
                        if (!computeStatus(p).name().toLowerCase().equals(status)) return false;
                    }
                    if (supplier != null && !supplier.equals("all")) {
                        if (p.getFournisseurNom() == null || !p.getFournisseurNom().equals(supplier)) return false;
                    }
                    if (dateDebut != null && dateFin != null) {
                        LocalDate dateRef = (stock != null && stock.getDateDerniereSortie() != null)
                                ? stock.getDateDerniereSortie()
                                : null;
                        if (dateRef == null) return false;
                        if (dateRef.isBefore(dateDebut) || dateRef.isAfter(dateFin)) return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());

        // ---- TRI DYNAMIQUE ----
        // On applique le tri demandé par le client (via le paramètre `sort`)
        Comparator<Produit> comparator = null;
        if (pageable.getSort().isSorted()) {
            for (Sort.Order order : pageable.getSort()) {
                Comparator<Produit> fieldComparator = switch (order.getProperty()) {
                    case "designation" -> Comparator.comparing(Produit::getDesignation, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
                    case "code" -> Comparator.comparing(Produit::getCodeArticle);
                    case "category" -> Comparator.comparing(p -> p.getCategorie() != null ? p.getCategorie().getNom() : "", Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
                    case "stock" -> Comparator.comparing(p -> p.getStockPhysique() != null ? p.getStockPhysique().getQuantiteTheorique() : BigDecimal.ZERO);
                    case "pmp" -> Comparator.comparing(p -> p.getStockPhysique() != null ? p.getStockPhysique().getPmpActuel() : BigDecimal.ZERO);
                    case "location" -> Comparator.comparing(p -> p.getStockPhysique() != null ? p.getStockPhysique().getEmplacementPrincipal() : "", Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
                    case "status" -> Comparator.comparing(p -> computeStatus(p).ordinal());
                    default -> null;
                };
                if (fieldComparator != null) {
                    if (order.isDescending()) fieldComparator = fieldComparator.reversed();
                    comparator = (comparator == null) ? fieldComparator : comparator.thenComparing(fieldComparator);
                }
            }
        }
        if (comparator != null) {
            filtered = filtered.stream().sorted(comparator).collect(Collectors.toList());
        }

        // Pagination manuelle
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<Produit> pageContent = (start > filtered.size()) ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(
                pageContent.stream().map(this::toResumeResponse).collect(Collectors.toList()),
                pageable,
                filtered.size()
        );
    }


    // dans CategorieService (ou directement dans CatalogueService si vous préférez)
    public Set<String> getDescendantCategoryNames(String parentName) {
        Categorie parent = categorieRepository.findByNom(parentName)
                .orElseThrow(() -> new NoSuchElementException("Catégorie introuvable : " + parentName));
        Set<String> names = new HashSet<>();
        collectDescendantNames(parent, names);
        return names;
    }

    private void collectDescendantNames(Categorie categorie, Set<String> names) {
        names.add(categorie.getNom());
        if (categorie.getSousCategories() != null) {
            for (Categorie child : categorie.getSousCategories()) {
                collectDescendantNames(child, names);
            }
        }
    }

    // -------------------------------------------------------------------
    // DÉTAIL PRODUIT
    // -------------------------------------------------------------------
    public ProduitDetailResponse getProduitDetail(Long id) {
        Produit p = produitRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Produit introuvable"));
        return toDetailResponse(p);
    }

    // -------------------------------------------------------------------
    // CRÉATION
    // -------------------------------------------------------------------
    @Transactional
    public ProduitDetailResponse createProduit(ProduitFormRequest form, String login) {
        Categorie categorie = null;
        if (form.getCategoryPath() != null && !form.getCategoryPath().isBlank()) {
            String[] segments = form.getCategoryPath().split(" > ");
            String nomCat = segments[segments.length - 1].trim();
            if (!nomCat.isEmpty()) {
                categorie = categorieRepository.findByNom(nomCat).orElse(null);
                if (categorie == null) {
                    log.warn("Catégorie '{}' introuvable, le produit sera créé sans catégorie", nomCat);
                }
            }
        }

        Produit produit = Produit.builder()
                .codeArticle(form.getCode())
                .designation(form.getName())
                .description(form.getDescription())
                .uniteMesure("pièce")
                .imageUrl(form.getImageUrl())
                .estConsignable(form.isConsignable())
                .quantiteMin(BigDecimal.valueOf(form.getMinThreshold()))
                .categorie(categorie)
                .rayonEmplacement(form.getLocation())
                .fournisseurNom(form.getSupplier())
                .build();

        BigDecimal qteInitiale = BigDecimal.valueOf(form.getCurrentStock());
        StockPhysique stock = StockPhysique.builder()
                .produit(produit)
                .quantiteTheorique(qteInitiale)
                .quantiteReservee(BigDecimal.ZERO)
                .pmpActuel(BigDecimal.ZERO) // sera mis à jour ci-dessous
                .cumulEntree(BigDecimal.ZERO)
                .cumulSortie(BigDecimal.ZERO)
                .emplacementPrincipal(form.getLocation())
                .build();

        // Valorisation du stock initial : PMP via prix d'achat ou champ direct
        if (form.getCurrentStock() > 0) {
            if (form.getPrixUnitaireHT() != null && form.getPrixUnitaireHT().compareTo(BigDecimal.ZERO) > 0) {
                stock.recalculerPMP(qteInitiale, form.getPrixUnitaireHT());
            } else {
                stock.setPmpActuel(form.getPmp() != null ? form.getPmp() : BigDecimal.ZERO);
            }
        }
        produit.setStockPhysique(stock);

        try {
            mettreAJourFicheTechnique(produit, form);
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour de la fiche technique", e);
        }

        produit = produitRepository.save(produit);

        if (form.getCurrentStock() > 0) {
            try {
                mouvementService.enregistrer(produit, TypeMouvement.ENTREE,
                        form.getCurrentStock(), stock.getPmpActuel(), "Stock initial", login, qteInitiale, null);
            } catch (Exception e) {
                log.warn("Impossible d'enregistrer le mouvement initial pour le produit {} : {}", produit.getId(), e.getMessage());
            }
        }
        return toDetailResponse(produit);
    }

    // -------------------------------------------------------------------
    // MODIFICATION
    // -------------------------------------------------------------------
    @Transactional
    public ProduitDetailResponse updateProduit(Long id, ProduitFormRequest form, String login) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Produit introuvable"));
        StockPhysique stock = produit.getStockPhysique();

        int oldStock = stock.getQuantiteTheorique().intValue();
        int newStock = form.getCurrentStock();
        BigDecimal newPmp = stock.getPmpActuel(); // valeur de départ

        produit.setDesignation(form.getName());
        produit.setDescription(form.getDescription());
        produit.setImageUrl(form.getImageUrl());
        produit.setEstConsignable(form.isConsignable());
        produit.setQuantiteMin(BigDecimal.valueOf(form.getMinThreshold()));
        produit.setRayonEmplacement(form.getLocation());
        produit.setFournisseurNom(form.getSupplier());
        stock.setEmplacementPrincipal(form.getLocation());

        // Mise à jour de la catégorie
        if (form.getCategoryPath() != null && !form.getCategoryPath().isBlank()) {
            String[] segments = form.getCategoryPath().split(" > ");
            String nomCat = segments[segments.length - 1].trim();
            if (!nomCat.isEmpty()) {
                Categorie categorie = categorieRepository.findByNom(nomCat).orElse(null);
                produit.setCategorie(categorie);
                if (categorie == null) {
                    log.warn("Catégorie '{}' introuvable, catégorie inchangée", nomCat);
                }
            }
        } else {
            produit.setCategorie(null);
        }

        String motif = (form.getMotif() != null && !form.getMotif().isBlank())
                ? form.getMotif()
                : "Ajustement manuel";

        if (newStock != oldStock) {
            int delta = newStock - oldStock;
            TypeMouvement type = TypeMouvement.AJUSTEMENT;
            stock.setQuantiteTheorique(BigDecimal.valueOf(newStock));

            if (delta > 0) {
                // Entrée -> recalcul PMP si prix d'achat fourni
                if (form.getPrixAchatHT() != null && form.getPrixAchatHT().compareTo(BigDecimal.ZERO) > 0) {
                    stock.recalculerPMP(BigDecimal.valueOf(delta), form.getPrixAchatHT());
                    newPmp = stock.getPmpActuel();
                }
                stock.setCumulEntree(stock.getCumulEntree().add(BigDecimal.valueOf(delta)));
            } else {
                // Sortie -> pas de changement de PMP
                stock.setCumulSortie(stock.getCumulSortie().add(BigDecimal.valueOf(-delta)));
            }

            mouvementService.enregistrer(produit, type, delta, newPmp, motif, login,
                    BigDecimal.valueOf(newStock), null);
        } else {
            // Aucun changement de quantité : on autorise juste la mise à jour du PMP
            if (form.getPmp() != null) {
                newPmp = form.getPmp();
            }
        }

        stock.setPmpActuel(newPmp);
        mettreAJourFicheTechnique(produit, form);
        produitRepository.save(produit);
        return toDetailResponse(produit);
    }

    // -------------------------------------------------------------------
    // SUPPRESSION
    // -------------------------------------------------------------------
    @Transactional
    public void deleteProduit(Long id) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Produit introuvable"));
        boolean hasRealMovements = journalMouvementRepository.existsMouvementsReelsByProduitId(id);
        if (hasRealMovements) {
            throw new IllegalStateException("Suppression impossible : l'article possède des mouvements de stock réels.");
        }
        produitRepository.delete(produit);
    }

    // -------------------------------------------------------------------
    // AJUSTEMENT RAPIDE
    // -------------------------------------------------------------------
    @Transactional
    public void ajusterStock(Long id, int nouvelleQuantite, String motif, BigDecimal prixUnitaire, String login) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Produit introuvable"));
        StockPhysique stock = produit.getStockPhysique();
        int oldStock = stock.getQuantiteTheorique().intValue();
        int delta = nouvelleQuantite - oldStock;
        if (delta == 0) return;

        BigDecimal newPmp = stock.getPmpActuel();
        if (delta > 0 && prixUnitaire != null && prixUnitaire.compareTo(BigDecimal.ZERO) > 0) {
            stock.recalculerPMP(BigDecimal.valueOf(delta), prixUnitaire);
            newPmp = stock.getPmpActuel();
        }

        stock.setQuantiteTheorique(BigDecimal.valueOf(nouvelleQuantite));
        stock.setPmpActuel(newPmp);
        if (delta > 0) {
            stock.setCumulEntree(stock.getCumulEntree().add(BigDecimal.valueOf(delta)));
        } else {
            stock.setCumulSortie(stock.getCumulSortie().add(BigDecimal.valueOf(-delta)));
        }

        mouvementService.enregistrer(produit, TypeMouvement.AJUSTEMENT, delta, newPmp, motif, login,
                BigDecimal.valueOf(nouvelleQuantite), null);
        produitRepository.save(produit);
    }

    // -------------------------------------------------------------------
    // EMPLACEMENTS DISTINCTS
    // -------------------------------------------------------------------
    public List<String> getDistinctEmplacements() {
        return stockPhysiqueRepository.findDistinctEmplacementPrincipal();
    }

    // ===================================================================
    // MÉTHODES PRIVÉES
    // ===================================================================

    private StockStatus computeStatus(Produit p) {
        StockPhysique stock = p.getStockPhysique();
        int qte = (stock != null && stock.getQuantiteTheorique() != null) ? stock.getQuantiteTheorique().intValue() : 0;
        int seuil = (p.getQuantiteMin() != null) ? p.getQuantiteMin().intValue() : 0;
        if (qte <= 0) return StockStatus.CRITIQUE;
        if (qte <= seuil) return StockStatus.FAIBLE;
        return StockStatus.OK;
    }

    private ProduitResumeResponse toResumeResponse(Produit p) {
        StockPhysique stock = p.getStockPhysique();
        int qteTheorique = 0, qteReservee = 0;
        BigDecimal avgPrice = BigDecimal.ZERO;
        String location = "";
        if (stock != null) {
            qteTheorique = stock.getQuantiteTheorique() != null ? stock.getQuantiteTheorique().intValue() : 0;
            qteReservee  = stock.getQuantiteReservee()  != null ? stock.getQuantiteReservee().intValue()  : 0;
            avgPrice     = stock.getPmpActuel() != null ? stock.getPmpActuel() : BigDecimal.ZERO;
            location     = stock.getEmplacementPrincipal() != null ? stock.getEmplacementPrincipal() : "";
        }
        int seuil = p.getQuantiteMin() != null ? p.getQuantiteMin().intValue() : 0;
        StockStatus statusEnum = computeStatus(p);
        String status = statusEnum.name().toLowerCase();
        String category = p.getCategorie() != null ? p.getCategorie().getNom() : "Général";

        return ProduitResumeResponse.builder()
                .id(p.getId())
                .code(p.getCodeArticle())
                .name(p.getDesignation())
                .category(category)
                .location(location)
                .quantiteTheorique(qteTheorique)
                .quantiteReservee(qteReservee)
                .currentStock(qteTheorique)
                .minThreshold(seuil)
                .avgPrice(avgPrice)
                .imageUrl(p.getImageUrl())
                .supplier(p.getFournisseurNom())
                .status(status)
                .build();
    }

    private String buildCategoryPath(Categorie categorie) {
        if (categorie == null) return null;
        List<String> segments = new ArrayList<>();
        Categorie current = categorie;
        while (current != null) {
            segments.add(0, current.getNom());
            current = current.getParent();
        }
        return String.join(" > ", segments);
    }

    /**
     * Construit le DTO détail avec toutes les valeurs calculées de manière robuste.
     * Les cumuls sont ceux de l'exercice comptable en cours (année civile).
     */
    private ProduitDetailResponse toDetailResponse(Produit p) {
        StockPhysique stock = p.getStockPhysique();
        FicheTechnique fiche = p.getFicheTechnique();

        // ---- valeurs par défaut ----
        int qteTheorique = 0, qteReservee = 0;
        BigDecimal avgPrice = BigDecimal.ZERO;
        String location = "";

        if (stock != null) {
            qteTheorique = stock.getQuantiteTheorique() != null ? stock.getQuantiteTheorique().intValue() : 0;
            qteReservee  = stock.getQuantiteReservee()  != null ? stock.getQuantiteReservee().intValue()  : 0;
            avgPrice     = stock.getPmpActuel() != null ? stock.getPmpActuel() : BigDecimal.ZERO;
            location     = stock.getEmplacementPrincipal() != null ? stock.getEmplacementPrincipal() : "";
        }

        // ---- cumuls annuels (robustes) ----
        int cumulEntree = 0, cumulSortie = 0;
        BigDecimal cumulValEntree = BigDecimal.ZERO, cumulValSortie = BigDecimal.ZERO;
        try {
            cumulEntree = calculerCumulQuantiteAnnuel(p, TypeMouvement.ENTREE);
            cumulSortie = calculerCumulQuantiteAnnuel(p, TypeMouvement.SORTIE);
            cumulValEntree = calculerCumulValeurAnnuel(p, TypeMouvement.ENTREE);
            cumulValSortie = calculerCumulValeurAnnuel(p, TypeMouvement.SORTIE);
        } catch (Exception e) {
            log.warn("Erreur lors du calcul des cumuls annuels pour le produit {} : {}", p.getId(), e.getMessage());
        }

        // ---- dates (null-safe) ----
        String dateDerniereEntree = (stock != null && stock.getDateDerniereEntree() != null)
                ? stock.getDateDerniereEntree().toString() : null;
        String dateDerniereSortie = (stock != null && stock.getDateDerniereSortie() != null)
                ? stock.getDateDerniereSortie().toString() : null;
        String createdAt = null;
        String lastUpdated = null;
        try {
            createdAt = p.getCreatedAt() != null ? p.getCreatedAt().toLocalDate().toString() : null;
            lastUpdated = p.getUpdatedAt() != null ? p.getUpdatedAt().toLocalDate().toString() : null;
        } catch (Exception e) {
            log.warn("Erreur lors de la récupération des dates d'audit pour le produit {} : {}", p.getId(), e.getMessage());
        }

        return ProduitDetailResponse.builder()
                .id(p.getId())
                .code(p.getCodeArticle())
                .name(p.getDesignation())
                .category(p.getCategorie() != null ? p.getCategorie().getNom() : "Général")
                .subcategory(buildCategoryPath(p.getCategorie()))
                .location(location)
                .quantiteTheorique(qteTheorique)
                .quantiteReservee(qteReservee)
                .currentStock(qteTheorique)
                .minThreshold(p.getQuantiteMin() != null ? p.getQuantiteMin().intValue() : 0)
                .avgPrice(avgPrice)
                .imageUrl(p.getImageUrl())
                .description(p.getDescription())
                .weight(fiche != null && fiche.getPoidsUnitaire() != null ? fiche.getPoidsUnitaire().toString() : null)
                .dimensions(fiche != null ? fiche.getDimensions() : null)
                .material(fiche != null ? fiche.getMateriau() : null)
                .safetyInstructions(fiche != null ? fiche.getInstructionsSecurite() : null)
                .consignable(p.getEstConsignable() != null && p.getEstConsignable())
                .supplier(p.getFournisseurNom())
                .warrantyMonths(0)
                .dateDerniereEntree(dateDerniereEntree)
                .dateDerniereSortie(dateDerniereSortie)
                .createdAt(createdAt)
                .lastUpdated(lastUpdated)
                .cumulEntree(cumulEntree)
                .cumulSortie(cumulSortie)
                .cumulValEntree(cumulValEntree)
                .cumulValSortie(cumulValSortie)
                .build();
    }

    /**
     * Calcule la quantité cumulée (entrée ou sortie) sur l'année civile en cours.
     */
    private int calculerCumulQuantiteAnnuel(Produit p, TypeMouvement type) {
        int annee = LocalDate.now().getYear();
        LocalDate debut = LocalDate.of(annee, 1, 1);
        LocalDate fin   = LocalDate.of(annee, 12, 31);

        return journalMouvementRepository.findByProduitId(p.getId()).stream()
                .filter(j -> j.getType() == type)
                .filter(j -> {
                    LocalDate d = j.getDateMouvement().toLocalDate();
                    return !d.isBefore(debut) && !d.isAfter(fin);
                })
                .flatMap(j -> j.getLignes().stream())
                .mapToInt(l -> l.getQuantite() != null ? l.getQuantite().intValue() : 0)
                .sum();
    }

    /**
     * Calcule la valeur cumulée (entrée ou sortie) sur l'année civile en cours.
     */
    private BigDecimal calculerCumulValeurAnnuel(Produit p, TypeMouvement type) {
        int annee = LocalDate.now().getYear();
        LocalDate debut = LocalDate.of(annee, 1, 1);
        LocalDate fin   = LocalDate.of(annee, 12, 31);

        return journalMouvementRepository.findByProduitId(p.getId()).stream()
                .filter(j -> j.getType() == type)
                .filter(j -> {
                    LocalDate d = j.getDateMouvement().toLocalDate();
                    return !d.isBefore(debut) && !d.isAfter(fin);
                })
                .flatMap(j -> j.getLignes().stream())
                .map(l -> l.getQuantite() != null && l.getPmpSnapshot() != null
                        ? l.getQuantite().multiply(l.getPmpSnapshot())
                        : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void mettreAJourFicheTechnique(Produit produit, ProduitFormRequest form) {
        FicheTechnique fiche = produit.getFicheTechnique();
        if (fiche == null) {
            fiche = new FicheTechnique();
            fiche.setProduit(produit);
        }
        fiche.setPoidsUnitaire(parseBigDecimalSafe(form.getWeight()));
        fiche.setDimensions(form.getDimensions());
        fiche.setMateriau(form.getMaterial());
        fiche.setInstructionsSecurite(form.getSafetyInstructions());
        produit.setFicheTechnique(fiche);
    }

    private BigDecimal parseBigDecimalSafe(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}