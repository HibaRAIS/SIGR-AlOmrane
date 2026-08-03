// src/main/java/com/alomrane/sigr/service/ReceptionService.java
package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.request.BonEntreeSignaturesDto;
import com.alomrane.sigr.dto.request.DocumentJointRequest;
import com.alomrane.sigr.dto.request.LigneReceptionRequest;
import com.alomrane.sigr.dto.request.ReceptionCreateRequest;
import com.alomrane.sigr.dto.response.*;
import com.alomrane.sigr.model.*;
import com.alomrane.sigr.model.enums.*;
import com.alomrane.sigr.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReceptionService {

    private final ReceptionRepository receptionRepo;
    private final ReliquatRepository reliquatRepo;
    private final CommandeAchatRepository commandeRepo;
    private final ProduitRepository produitRepo;
    private final StockPhysiqueRepository stockRepo;
    private final MouvementService mouvementService;
    private final CategorieRepository categorieRepo;
    private final FournisseurRepository fournisseurRepo;

    // ─── Pagination & filtres ──────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<ReceptionResponse> getReceptions(Pageable pageable, String search, String statut,
                                                 String fournisseur, LocalDate dateDebut, LocalDate dateFin) {
        Specification<Reception> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("numero")), pattern),
                        cb.like(cb.lower(root.join("commande").get("reference")), pattern),
                        cb.like(cb.lower(root.get("bonLivraison")), pattern),
                        cb.like(cb.lower(root.get("numeroFacture")), pattern),
                        cb.like(cb.lower(root.get("codeMarche")), pattern),
                        cb.like(cb.lower(root.join("commande").get("fournisseur")), pattern)
                ));
            }
            if (statut != null && !statut.equals("ALL")) {
                predicates.add(cb.equal(root.get("statut"), StatutReception.valueOf(statut)));
            }
            if (fournisseur != null && !fournisseur.equals("ALL")) {
                predicates.add(cb.equal(root.join("commande").get("fournisseur"), fournisseur));
            }
            if (dateDebut != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("dateReception"), dateDebut));
            }
            if (dateFin != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("dateReception"), dateFin));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return receptionRepo.findAll(spec, pageable).map(this::toResponse);
    }

    // ─── Statistiques ──────────────────────────────────────────────
    @Transactional(readOnly = true)
    public StatsReceptionsResponse getStats() {
        List<Reception> all = receptionRepo.findAll();
        long total = all.size();
        long conformes = all.stream().filter(r -> r.getStatut() == StatutReception.CONFORME).count();
        long partielles = all.stream().filter(r -> r.getStatut() == StatutReception.PARTIELLE).count();
        long complementaires = all.stream().filter(r -> r.getStatut() == StatutReception.COMPLEMENTAIRE).count();
        BigDecimal totalTTC = all.stream().map(Reception::getTotalTTC).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal montantConforme = all.stream().filter(r -> r.getStatut() == StatutReception.CONFORME)
                .map(Reception::getTotalTTC).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal montantPartielle = all.stream().filter(r -> r.getStatut() == StatutReception.PARTIELLE)
                .map(Reception::getTotalTTC).reduce(BigDecimal.ZERO, BigDecimal::add);
        long reliquatsOuverts = reliquatRepo.findByStatutNot(StatutReliquat.SOLDE).size();

        return StatsReceptionsResponse.builder()
                .total(total)
                .CONFORME(conformes)
                .PARTIELLE(partielles)
                .COMPLEMENTAIRE(complementaires)
                .totalTTC(totalTTC)
                .montantConforme(montantConforme)
                .montantPartielle(montantPartielle)
                .reliquatsOuverts(reliquatsOuverts)
                .build();
    }

    // ─── Détail ────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ReceptionResponse getOne(Long id) {
        Reception r = receptionRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Réception introuvable : " + id));
        return toResponse(r);
    }

    // ─── Création ──────────────────────────────────────────────────
    @Transactional
    public ReceptionResponse createReception(ReceptionCreateRequest req, String login) {
        CommandeAchat commande = commandeRepo.findById(req.getCommandeId())
                .orElseThrow(() -> new NoSuchElementException("Commande introuvable"));

        Reception reception = new Reception();
        reception.setNumero(generateNumero());
        reception.setTranche(determinerTranche(commande.getId()));
        reception.setDateReception(req.getDateReception());
        reception.setBonLivraison(req.getBonLivraison());
        reception.setNumeroFacture(req.getNumeroFacture());
        reception.setCodeMarche(req.getCodeMarche());
        reception.setCommande(commande);
        reception.setNotes(req.getNotes());
        reception.setCreatedBy(login);
        reception.setReliquatSource(req.getReliquatSource());
        reception.setConfirme(false);

        // Lignes de réception
        List<LigneReception> lignes = new ArrayList<>();
        for (LigneReceptionRequest lr : req.getLignes()) {
            Produit produit = trouverOuCreerProduit(lr.getCodeArticle(), lr.getDesignation(),
                    lr.getPrixUnitaireHT(), lr.getTva());
            LigneReception ligne = LigneReception.builder()
                    .reception(reception)
                    .produit(produit)
                    .codeArticle(lr.getCodeArticle())
                    .designation(lr.getDesignation())
                    .quantiteCommandee(lr.getQuantiteCommandee())
                    .quantiteRecue(lr.getQuantiteRecue())
                    .prixUnitaireHT(lr.getPrixUnitaireHT())
                    .tva(lr.getTva())
                    .build();
            ligne.calculerTotaux();
            lignes.add(ligne);
        }
        reception.setLignes(lignes);

        // 📌 Gestion des documents joints envoyés dans le JSON (optionnel, comme pour les commandes)
        if (req.getDocuments() != null) {
            for (DocumentJointRequest dr : req.getDocuments()) {
                DocumentJointReception doc = DocumentJointReception.builder()
                        .reception(reception)
                        .nom(dr.getNom())
                        .type(dr.getType())
                        .dataUrl(dr.getDataUrl())
                        .build();
                reception.getDocumentsJoints().add(doc);
            }
        }

        // Détermination du statut
        boolean allConforme = lignes.stream().allMatch(l -> l.getQuantiteRecue().equals(l.getQuantiteCommandee()));
        if (req.getReliquatSource() != null) {
            reception.setStatut(StatutReception.COMPLEMENTAIRE);
        } else if (allConforme) {
            reception.setStatut(StatutReception.CONFORME);
        } else {
            reception.setStatut(StatutReception.PARTIELLE);
        }

        // Calcul des totaux (utilise les getters calculés)
        reception.setTotalHT(reception.getTotalHT());
        reception.setTotalTTC(reception.getTotalTTC());

        reception = receptionRepo.save(reception);

        if (req.getReliquatSource() != null) {
            mettreAJourReliquatSource(req.getReliquatSource(), reception);
        }

        return toResponse(reception);
    }

    // ─── Mise à jour ──────────────────────────────────────────────
    @Transactional
    public ReceptionResponse updateReception(Long id, ReceptionCreateRequest req, String login) {
        Reception reception = receptionRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Réception introuvable : " + id));

        // Champs administratifs modifiables même après confirmation
        reception.setBonLivraison(req.getBonLivraison());
        reception.setNumeroFacture(req.getNumeroFacture());
        reception.setCodeMarche(req.getCodeMarche());
        reception.setDateReception(req.getDateReception());
        reception.setNotes(req.getNotes());
        reception.setUpdatedBy(login);
        reception.setUpdatedAt(LocalDateTime.now());

        // Lignes & statut : uniquement si la réception n'est pas encore confirmée
        if (!reception.isConfirme()) {
            reception.getLignes().clear();
            List<LigneReception> nouvellesLignes = new ArrayList<>();
            for (LigneReceptionRequest lr : req.getLignes()) {
                Produit produit = trouverOuCreerProduit(lr.getCodeArticle(), lr.getDesignation(),
                        lr.getPrixUnitaireHT(), lr.getTva());
                LigneReception ligne = LigneReception.builder()
                        .reception(reception)
                        .produit(produit)
                        .codeArticle(lr.getCodeArticle())
                        .designation(lr.getDesignation())
                        .quantiteCommandee(lr.getQuantiteCommandee())
                        .quantiteRecue(lr.getQuantiteRecue())
                        .prixUnitaireHT(lr.getPrixUnitaireHT())
                        .tva(lr.getTva())
                        .build();
                ligne.calculerTotaux();
                nouvellesLignes.add(ligne);
            }
            reception.getLignes().addAll(nouvellesLignes);

            // Recalcul du statut
            boolean allConforme = nouvellesLignes.stream()
                    .allMatch(l -> l.getQuantiteRecue().equals(l.getQuantiteCommandee()));
            if (reception.getReliquatSource() != null) {
                reception.setStatut(StatutReception.COMPLEMENTAIRE);
            } else if (allConforme) {
                reception.setStatut(StatutReception.CONFORME);
            } else {
                reception.setStatut(StatutReception.PARTIELLE);
            }

            // Mise à jour des totaux
            reception.setTotalHT(reception.getTotalHT());
            reception.setTotalTTC(reception.getTotalTTC());
        }

        // 📌 Gestion des documents : TOUJOURS autorisée (même après confirmation)
        if (req.getDocuments() != null) {
            reception.getDocumentsJoints().clear();
            for (DocumentJointRequest dr : req.getDocuments()) {
                DocumentJointReception doc = DocumentJointReception.builder()
                        .reception(reception)
                        .nom(dr.getNom())
                        .type(dr.getType())
                        .dataUrl(dr.getDataUrl())
                        .build();
                reception.getDocumentsJoints().add(doc);
            }
        }

        reception = receptionRepo.save(reception);
        return toResponse(reception);
    }

    // ─── Signatures du bon d'entrée ────────────────────────────────
    @Transactional
    public ReceptionResponse saveSignatures(Long id, BonEntreeSignaturesDto signaturesDto, String login) {
        Reception reception = receptionRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Réception introuvable : " + id));

        BonEntreeSignatures signatures = reception.getBonEntreeSignatures();
        if (signatures == null) {
            signatures = new BonEntreeSignatures();
            signatures.setReception(reception);
            reception.setBonEntreeSignatures(signatures);
        }

        if (signaturesDto.getResponsableMagasinImg() != null) {
            signatures.setResponsableMagasinImg(signaturesDto.getResponsableMagasinImg());
            signatures.setResponsableMagasinDate(signaturesDto.getResponsableMagasinDate());
        }
        if (signaturesDto.getChefLogistiqueImg() != null) {
            signatures.setChefLogistiqueImg(signaturesDto.getChefLogistiqueImg());
            signatures.setChefLogistiqueDate(signaturesDto.getChefLogistiqueDate());
        }

        reception.setBonEntreeGenere(true);
        reception.setUpdatedBy(login);
        reception.setUpdatedAt(LocalDateTime.now());

        receptionRepo.save(reception);
        return toResponse(reception);
    }

    // ─── Confirmation & mise à jour du stock ───────────────────────
    @Transactional
    public ReceptionResponse confirmerReception(Long id, String login) {
        Reception reception = receptionRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Réception introuvable"));
        if (reception.isConfirme()) {
            throw new IllegalStateException("Cette réception est déjà confirmée");
        }

        for (LigneReception ligne : reception.getLignes()) {
            Produit produit = ligne.getProduit();
            if (produit == null) continue;

            StockPhysique stock = produit.getStockPhysique();
            if (stock == null) {
                stock = StockPhysique.builder()
                        .produit(produit)
                        .quantiteTheorique(BigDecimal.ZERO)
                        .pmpActuel(BigDecimal.ZERO)
                        .cumulEntree(BigDecimal.ZERO)
                        .cumulSortie(BigDecimal.ZERO)
                        .quantiteReservee(BigDecimal.ZERO)
                        .emplacementPrincipal(produit.getRayonEmplacement() != null ? produit.getRayonEmplacement() : "")
                        .build();
                stock = stockRepo.save(stock);
                produit.setStockPhysique(stock);
                produitRepo.save(produit);
            }

            // Sauvegarde des valeurs avant mise à jour
            ligne.setPmpAvant(stock.getPmpActuel());
            ligne.setStockAvant(stock.getQuantiteTheorique());

            BigDecimal qteRecue = BigDecimal.valueOf(ligne.getQuantiteRecue());
            BigDecimal prixAchat = ligne.getPrixUnitaireHT();

            stock.recalculerPMP(qteRecue, prixAchat);
            stock.setQuantiteTheorique(stock.getQuantiteTheorique().add(qteRecue));
            stock.setCumulEntree(stock.getCumulEntree().add(qteRecue));
            stock = stockRepo.save(stock);

            try {
                mouvementService.enregistrer(
                        produit,
                        TypeMouvement.ENTREE,
                        ligne.getQuantiteRecue(),
                        stock.getPmpActuel(),
                        "Réception " + reception.getNumero(),
                        login,
                        stock.getQuantiteTheorique(),
                        reception.getNumero()
                );
            } catch (Exception e) {
                log.error("Erreur mouvement pour produit {} : {}", produit.getId(), e.getMessage(), e);
                throw new RuntimeException("Erreur lors de la mise à jour des mouvements : " + e.getMessage(), e);
            }

            // Sauvegarde des valeurs après mise à jour
            ligne.setPmpApres(stock.getPmpActuel());
            ligne.setStockApres(stock.getQuantiteTheorique());
        }

        reception.setConfirme(true);
        reception.setConfirmeAt(LocalDateTime.now());
        reception.setConfirmeBy(login);

        // Génération du reliquat si réception partielle
        if (reception.getStatut() == StatutReception.PARTIELLE) {
            creerReliquat(reception);
        }

        receptionRepo.save(reception);
        return toResponse(reception);
    }

    // ═══════════════════════════════════════════════════════════════
    // DOCUMENTS JOINTS – UPLOAD / SUPPRESSION / CONVERSION
    // (Fonctionnement multipart comme attendu par le frontend)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Ajoute un document à une réception à partir d'un fichier uploadé.
     * Le fichier est converti en data URL (base64) et stocké en base.
     */
    @Transactional
    public DocumentJointReceptionResponse uploadDocument(Long receptionId, MultipartFile file) {
        Reception reception = receptionRepo.findById(receptionId)
                .orElseThrow(() -> new NoSuchElementException("Réception introuvable"));

        String dataUrl = convertirFichierEnDataUrl(file);

        DocumentJointReception doc = DocumentJointReception.builder()
                .reception(reception)
                .nom(file.getOriginalFilename())
                .type(file.getContentType())
                .dataUrl(dataUrl)
                .build();

        reception.getDocumentsJoints().add(doc);
        receptionRepo.save(reception);

        return toDocReceptionResponse(doc);
    }

    /**
     * Supprime un document joint d'une réception.
     */
    @Transactional
    public void deleteDocument(Long receptionId, Long documentId) {
        Reception reception = receptionRepo.findById(receptionId)
                .orElseThrow(() -> new NoSuchElementException("Réception introuvable"));

        DocumentJointReception doc = reception.getDocumentsJoints().stream()
                .filter(d -> d.getId().equals(documentId))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("Document introuvable"));

        reception.getDocumentsJoints().remove(doc);
        receptionRepo.save(reception); // la suppression est effective grâce à orphanRemoval = true
    }

    /**
     * Convertit un fichier Multipart en chaîne data URL (RFC 2397).
     */
    private String convertirFichierEnDataUrl(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            String base64 = Base64.getEncoder().encodeToString(bytes);
            return "data:" + file.getContentType() + ";base64," + base64;
        } catch (IOException e) {
            throw new RuntimeException("Erreur de lecture du fichier", e);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // MÉTHODES PRIVÉES – LOGIQUE MÉTIER
    // ═══════════════════════════════════════════════════════════════

    private Produit trouverOuCreerProduit(String codeArticle, String designation, BigDecimal prix, BigDecimal tva) {
        if (codeArticle != null && !codeArticle.isBlank()) {
            Optional<Produit> existant = produitRepo.findByCodeArticle(codeArticle);
            if (existant.isPresent()) return existant.get();
            return creerNouveauProduit(codeArticle, designation);
        }

        // Génération d'un code unique si non fourni
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "PRD-" + today + "-";
        long count = produitRepo.countByCodeArticleStartingWith(prefix);
        String code;
        do {
            count++;
            code = prefix + String.format("%03d", count);
        } while (produitRepo.findByCodeArticle(code).isPresent());
        return creerNouveauProduit(code, designation);
    }

    private Produit creerNouveauProduit(String code, String designation) {
        Categorie categorieGenerale = categorieRepo.findByNom("Général").orElse(null);
        Produit nouveau = Produit.builder()
                .codeArticle(code)
                .designation(designation)
                .uniteMesure("pièce")
                .estConsignable(false)
                .quantiteMin(BigDecimal.ZERO)
                .categorie(categorieGenerale)
                .rayonEmplacement("")
                .build();
        // Le @PrePersist de Produit crée automatiquement le StockPhysique
        return produitRepo.save(nouveau);
    }

    private String generateNumero() {
        int year = LocalDate.now().getYear();
        long count = receptionRepo.countByNumeroStartingWith("RE-" + year + "-");
        return String.format("RE-%d-%03d", year, count + 1);
    }

    private int determinerTranche(Long commandeId) {
        return receptionRepo.findByCommandeId(commandeId).stream()
                .mapToInt(Reception::getTranche)
                .max()
                .orElse(0) + 1;
    }

    private void creerReliquat(Reception reception) {
        CommandeAchat commande = reception.getCommande();
        List<Reception> toutesReceptions = receptionRepo.findByCommandeId(commande.getId());

        Map<Long, Integer> totalRecuParProduit = new HashMap<>();
        for (Reception r : toutesReceptions) {
            if (r.isConfirme()) {
                for (LigneReception lr : r.getLignes()) {
                    if (lr.getProduit() != null) {
                        totalRecuParProduit.merge(lr.getProduit().getId(), lr.getQuantiteRecue(), Integer::sum);
                    }
                }
            }
        }

        List<LigneReliquat> lignesReliquat = new ArrayList<>();
        for (LigneReception lr : reception.getLignes()) {
            if (lr.getProduit() == null) continue;
            Long produitId = lr.getProduit().getId();
            int totalRecu = totalRecuParProduit.getOrDefault(produitId, 0);
            int quantiteCommandeeTotale = lr.getQuantiteCommandee();
            int restant = Math.max(0, quantiteCommandeeTotale - totalRecu);
            if (restant > 0) {
                LigneReliquat rl = LigneReliquat.builder()
                        .reliquat(null)
                        .produit(lr.getProduit())
                        .designation(lr.getDesignation())
                        .reference(lr.getCodeArticle())
                        .quantiteInitiale(restant)
                        .quantiteRestante(restant)
                        .prixUnitaireHT(lr.getPrixUnitaireHT())
                        .tva(lr.getTva())
                        .build();
                lignesReliquat.add(rl);
            }
        }

        if (!lignesReliquat.isEmpty()) {
            String id = generateReliquatId();
            Reliquat reliquat = Reliquat.builder()
                    .id(id)
                    .commande(commande)
                    .statut(StatutReliquat.EN_ATTENTE)
                    .receptionSourceId(reception.getId())
                    .receptionSourceNumero(reception.getNumero())
                    .build();
            reliquat = reliquatRepo.save(reliquat);

            for (LigneReliquat rl : lignesReliquat) {
                rl.setReliquat(reliquat);
            }
            reliquat.setLignes(lignesReliquat);
            reliquatRepo.save(reliquat);

            reception.setReliquatLie(id);
        }
    }

    private void mettreAJourReliquatSource(String reliquatId, Reception complementaire) {
        Reliquat reliquat = reliquatRepo.findById(reliquatId).orElse(null);
        if (reliquat == null) return;

        for (LigneReception lr : complementaire.getLignes()) {
            if (lr.getProduit() == null) continue;
            Long produitId = lr.getProduit().getId();
            reliquat.getLignes().stream()
                    .filter(l -> l.getProduit() != null && l.getProduit().getId().equals(produitId))
                    .findFirst()
                    .ifPresent(ligneRel -> {
                        int nouvelleRestante = Math.max(0, ligneRel.getQuantiteRestante() - lr.getQuantiteRecue());
                        ligneRel.setQuantiteRestante(nouvelleRestante);
                    });
        }

        TrancheReliquat tranche = TrancheReliquat.builder()
                .reliquat(reliquat)
                .receptionId(complementaire.getId())
                .receptionNumero(complementaire.getNumero())
                .date(complementaire.getDateReception().toString())
                .build();
        List<LigneTrancheReliquat> lignesTranche = complementaire.getLignes().stream()
                .filter(l -> l.getProduit() != null)
                .map(l -> LigneTrancheReliquat.builder()
                        .tranche(tranche)
                        .produitId(l.getProduit().getId())
                        .quantiteRecue(l.getQuantiteRecue())
                        .build())
                .collect(Collectors.toList());
        tranche.setLignes(lignesTranche);
        reliquat.getTranches().add(tranche);

        boolean toutRecu = reliquat.getLignes().stream().allMatch(l -> l.getQuantiteRestante() == 0);
        reliquat.setStatut(toutRecu ? StatutReliquat.SOLDE : StatutReliquat.PARTIELLEMENT_TRAITE);

        reliquatRepo.save(reliquat);
    }

    private String generateReliquatId() {
        int year = LocalDate.now().getYear();
        long count = reliquatRepo.countByIdStartingWith("RLQ-" + year + "-");
        return String.format("RLQ-%d-%03d", year, count + 1);
    }

    // ═══════════════════════════════════════════════════════════════
    // MAPPING ENTITÉS → DTO
    // ═══════════════════════════════════════════════════════════════

    private ReceptionResponse toResponse(Reception r) {
        CommandeAchat cmd = r.getCommande();
        String fournisseurNom = cmd.getFournisseur();
        String fournisseurIce = null;
        if (fournisseurNom != null && !fournisseurNom.isBlank()) {
            fournisseurIce = fournisseurRepo.findByRaisonSociale(fournisseurNom)
                    .map(Fournisseur::getIce)
                    .orElse(null);
        }

        return ReceptionResponse.builder()
                .id(r.getId())
                .numero(r.getNumero())
                .tranche(r.getTranche())
                .statut(r.getStatut().name())
                .dateReception(r.getDateReception())
                .bonLivraison(r.getBonLivraison())
                .numeroFacture(r.getNumeroFacture())
                .codeMarche(r.getCodeMarche())
                .receptionnaire(r.getReceptionnaire())
                .commandeId(cmd.getId())
                .commandeReference(cmd.getReference())
                .fournisseurNom(fournisseurNom)
                .fournisseurIce(fournisseurIce)
                .methode(cmd.getMethode() != null ? cmd.getMethode().name() : null)
                .lignes(r.getLignes().stream().map(this::toLigneResponse).collect(Collectors.toList()))
                .notes(r.getNotes())
                .totalHT(r.getTotalHT())
                .totalTTC(r.getTotalTTC())
                .createdBy(r.getCreatedBy())
                .createdAt(r.getCreatedAt())
                .updatedBy(r.getUpdatedBy())
                .updatedAt(r.getUpdatedAt())
                .reliquatLie(r.getReliquatLie())
                .reliquatSource(r.getReliquatSource())
                // ⚠️ Important : les documents doivent être renvoyés avec leur data URL dans le champ "url"
                .documentsJoints(r.getDocumentsJoints().stream().map(this::toDocReceptionResponse).collect(Collectors.toList()))
                .bonEntreeSignatures(r.getBonEntreeSignatures() != null ? toSignaturesResponse(r.getBonEntreeSignatures()) : null)
                .bonEntreeGenere(r.isBonEntreeGenere())
                .confirme(r.isConfirme())
                .confirmeAt(r.getConfirmeAt())
                .confirmeBy(r.getConfirmeBy())
                .build();
    }

    private LigneReceptionResponse toLigneResponse(LigneReception l) {
        return LigneReceptionResponse.builder()
                .id(l.getId())
                .produitId(l.getProduit() != null ? l.getProduit().getId() : null)
                .codeArticle(l.getCodeArticle())
                .designation(l.getDesignation())
                .quantiteCommandee(l.getQuantiteCommandee())
                .quantiteRecue(l.getQuantiteRecue())
                .prixUnitaireHT(l.getPrixUnitaireHT())
                .tva(l.getTva())
                .totalHT(l.getTotalHT())
                .totalTTC(l.getTotalTTC())
                .pmpAvant(l.getPmpAvant())
                .pmpApres(l.getPmpApres())
                .stockAvant(l.getStockAvant())
                .stockApres(l.getStockApres())
                .build();
    }

    /**
     * Mappe un document joint en DTO.
     * Le champ "url" contient la data URL complète (base64) pour un affichage direct côté frontend.
     */
    private DocumentJointReceptionResponse toDocReceptionResponse(DocumentJointReception d) {
        return DocumentJointReceptionResponse.builder()
                .id(d.getId())
                .nom(d.getNom())
                .type(d.getType())
                .url(d.getDataUrl())   // 👈 CORRECTION : le frontend attend doc.url, on y met la data URL
                .dateAjout(d.getDateAjout())
                .build();
    }

    private BonEntreeSignaturesResponse toSignaturesResponse(BonEntreeSignatures s) {
        return BonEntreeSignaturesResponse.builder()
                .responsableMagasinImg(s.getResponsableMagasinImg())
                .responsableMagasinDate(s.getResponsableMagasinDate())
                .chefLogistiqueImg(s.getChefLogistiqueImg())
                .chefLogistiqueDate(s.getChefLogistiqueDate())
                .build();
    }

    // ─── Reliquats ─────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ReliquatResponse> getAllReliquats() {
        return reliquatRepo.findAll().stream().map(this::toReliquatResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReliquatResponse getReliquat(String id) {
        Reliquat r = reliquatRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Reliquat introuvable"));
        return toReliquatResponse(r);
    }

    private ReliquatResponse toReliquatResponse(Reliquat r) {
        return ReliquatResponse.builder()
                .id(r.getId())
                .commandeId(r.getCommande().getId())
                .commandeReference(r.getCommande().getReference())
                .fournisseurNom(r.getCommande().getFournisseur())
                .lignes(r.getLignes().stream().map(l -> LigneReliquatResponse.builder()
                        .produitId(l.getProduit() != null ? l.getProduit().getId() : null)
                        .designation(l.getDesignation())
                        .reference(l.getReference())
                        .quantiteInitiale(l.getQuantiteInitiale())
                        .quantiteRestante(l.getQuantiteRestante())
                        .prixUnitaireHT(l.getPrixUnitaireHT())
                        .tva(l.getTva())
                        .build()).collect(Collectors.toList()))
                .dateCreation(r.getDateCreation())
                .receptionSourceId(r.getReceptionSourceId())
                .receptionSourceNumero(r.getReceptionSourceNumero())
                .statut(r.getStatut().name())
                .tranches(r.getTranches().stream().map(t -> TrancheReliquatResponse.builder()
                        .receptionId(t.getReceptionId())
                        .receptionNumero(t.getReceptionNumero())
                        .date(t.getDate())
                        .lignes(t.getLignes().stream().map(lt -> LigneTrancheReliquatResponse.builder()
                                .produitId(lt.getProduitId())
                                .quantiteRecue(lt.getQuantiteRecue())
                                .build()).collect(Collectors.toList()))
                        .build()).collect(Collectors.toList()))
                .build();
    }
}