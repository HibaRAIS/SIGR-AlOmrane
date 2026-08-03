package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.response.MouvementResponse;
import com.alomrane.sigr.model.*;
import com.alomrane.sigr.model.enums.TypeMouvement;
import com.alomrane.sigr.repository.DemandeInterneRepository;
import com.alomrane.sigr.repository.JournalMouvementRepository;
import com.alomrane.sigr.repository.StockPhysiqueRepository;
import com.alomrane.sigr.repository.UtilisateurRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class MouvementService {

    private final JournalMouvementRepository journalMouvementRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final StockPhysiqueRepository stockPhysiqueRepository;
    private final DemandeInterneRepository demandeInterneRepository;
    private final HashChainService hashChainService;

    private final AtomicInteger compteur = new AtomicInteger(1);

    @PostConstruct
    void initCompteur() {
        String prefix = "MVT-" + LocalDate.now().toString().replace("-", "") + "-";
        Optional<String> dernierCode = journalMouvementRepository.findAll().stream()
                .map(JournalMouvement::getCodeUnique)
                .filter(c -> c != null && c.startsWith(prefix))
                .max(Comparator.naturalOrder());
        if (dernierCode.isPresent()) {
            String numeroStr = dernierCode.get().substring(dernierCode.get().lastIndexOf('-') + 1);
            try {
                compteur.set(Integer.parseInt(numeroStr) + 1);
            } catch (NumberFormatException ignored) {}
        }
    }

    private String genererCodeUnique() {
        String datePart = LocalDate.now().toString().replace("-", "");
        return String.format("MVT-%s-%04d", datePart, compteur.getAndIncrement());
    }

    @Transactional
    public void enregistrer(Produit produit, TypeMouvement type, int delta, BigDecimal pmp,
                            String motif, String login, BigDecimal stockApres,
                            String reference) {
        Utilisateur utilisateur = getUtilisateur(login);
        String codeUnique = genererCodeUnique();
        BigDecimal stockAvant = stockApres.subtract(BigDecimal.valueOf(delta));

        JournalMouvement journal = JournalMouvement.builder()
                .dateMouvement(LocalDateTime.now())
                .type(type)
                .codeUnique(codeUnique)
                .referenceDocument(reference)
                .utilisateur(utilisateur)
                .build();

        LigneMouvement ligne = LigneMouvement.builder()
                .produit(produit)
                .quantite(BigDecimal.valueOf(Math.abs(delta)))
                .stockAvant(stockAvant)
                .stockApres(stockApres)
                .pmpSnapshot(pmp)
                .valeurFlux(BigDecimal.valueOf(delta).multiply(pmp))
                .motif(motif)
                .journalMouvement(journal)
                .build();

        journal.getLignes().add(ligne);

        // Récupération du dernier hash depuis la base (ordre inverse de la vérification)
        String previousHash = journalMouvementRepository
                .findTopByOrderByDateMouvementDescIdDesc()
                .map(JournalMouvement::getHashChaine)
                .orElse("0");

        journal.setPreviousHash(previousHash);

        // Sauvegarde initiale pour persister l'entité et obtenir les valeurs exactes de la base
        journal = journalMouvementRepository.saveAndFlush(journal);

        // Rechargement depuis la base pour garantir que les données sont strictement les mêmes que lors de la vérification
        final JournalMouvement persisted = journalMouvementRepository.findById(journal.getId())
                .orElseThrow(() -> new RuntimeException("Mouvement non trouvé après sauvegarde"));

        // Calcul du hash avec les données réellement stockées
        LigneMouvement persistedLigne = hashChainService.getPremiereLigne(persisted);
        String hash = hashChainService.calculerHash(persisted, persistedLigne, previousHash);
        persisted.setHashChaine(hash);

        // Mise à jour du hash et du previousHash (déjà identique) via la méthode existante du repository
        journalMouvementRepository.updateHashChaineAndPreviousHash(persisted.getId(), hash, previousHash);

        // Mise à jour du stock physique (inchangé)
        StockPhysique stock = produit.getStockPhysique();
        if (stock != null) {
            if (type == TypeMouvement.ENTREE) {
                stock.setDateDerniereEntree(LocalDate.now());
            } else if (type == TypeMouvement.SORTIE) {
                stock.setDateDerniereSortie(LocalDate.now());
            }
            stockPhysiqueRepository.save(stock);
        }
    }

    public Page<MouvementResponse> getJournal(String search, String type, String produitDesignation,
                                              String departement, LocalDate dateDebut, LocalDate dateFin,
                                              Pageable pageable) {
        List<JournalMouvement> all = journalMouvementRepository.findAll();
        Stream<JournalMouvement> stream = all.stream();

        if (search != null && !search.isEmpty()) {
            String s = search.toLowerCase();
            stream = stream.filter(j -> j.getLignes().stream().anyMatch(l ->
                    l.getProduit().getDesignation().toLowerCase().contains(s) ||
                            l.getProduit().getCodeArticle().toLowerCase().contains(s) ||
                            (l.getMotif() != null && l.getMotif().toLowerCase().contains(s))
            ));
        }
        if (type != null && !type.isEmpty()) {
            stream = stream.filter(j -> j.getType().name().equals(type));
        }
        if (produitDesignation != null && !produitDesignation.isEmpty()) {
            stream = stream.filter(j -> j.getLignes().stream().anyMatch(l ->
                    l.getProduit().getDesignation().equals(produitDesignation)
            ));
        }
        if (dateDebut != null) {
            stream = stream.filter(j -> !j.getDateMouvement().toLocalDate().isBefore(dateDebut));
        }
        if (dateFin != null) {
            stream = stream.filter(j -> !j.getDateMouvement().toLocalDate().isAfter(dateFin));
        }

        List<JournalMouvement> filtered = stream.collect(Collectors.toList());
        List<MouvementResponse> responses = new ArrayList<>();

        for (JournalMouvement j : filtered) {
            for (LigneMouvement ligne : j.getLignes()) {
                Produit p = ligne.getProduit();
                int stockInitial = ligne.getStockApres().intValue() - (j.getType() == TypeMouvement.ENTREE ?
                        ligne.getQuantite().intValue() : -ligne.getQuantite().intValue());
                int stockAvant = ligne.getStockAvant() != null ? ligne.getStockAvant().intValue() : 0;

                String dept;
                if (j.getType() == TypeMouvement.SORTIE && j.getReferenceDocument() != null) {
                    Optional<DemandeInterne> demandeOpt = demandeInterneRepository
                            .findByNumeroDemande(j.getReferenceDocument());
                    if (demandeOpt.isPresent()) {
                        Structure structureDemandeur = demandeOpt.get().getEmploye().getStructure();
                        dept = structureDemandeur != null ? structureDemandeur.getNom() : "—";
                    } else {
                        dept = getDepartementUtilisateur(j.getUtilisateur());
                    }
                } else {
                    dept = getDepartementUtilisateur(j.getUtilisateur());
                }

                responses.add(MouvementResponse.builder()
                        .id(j.getId())
                        .codeUnique(j.getCodeUnique())
                        .date(j.getDateMouvement().toString())
                        .type(j.getType().name())
                        .referenceDocument(j.getReferenceDocument())
                        .designation(p.getDesignation())
                        .codeArticle(p.getCodeArticle())
                        .uniteMesure(p.getUniteMesure())
                        .quantiteMin(p.getQuantiteMin() != null ? p.getQuantiteMin().intValue() : 0)
                        .departement(dept)
                        .quantite(ligne.getQuantite().intValue())
                        .stockInitial(stockInitial)
                        .stockAvant(stockAvant)
                        .stockApres(ligne.getStockApres().intValue())
                        .pmpSnapshot(ligne.getPmpSnapshot())
                        .valeurFlux(ligne.getValeurFlux())
                        .utilisateur(j.getUtilisateur() != null ? j.getUtilisateur().getLoginLdap() : "Système")
                        .motif(ligne.getMotif())
                        .hashChaine(j.getHashChaine())
                        .build());
            }
        }

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), responses.size());
        return new PageImpl<>(responses.subList(start, end), pageable, responses.size());
    }

    private String getDepartementUtilisateur(Utilisateur utilisateur) {
        if (utilisateur == null || utilisateur.getEmploye() == null) return "—";
        Structure structure = utilisateur.getEmploye().getStructure();
        return structure != null ? structure.getNom() : "—";
    }

    private Utilisateur getUtilisateur(String login) {
        return utilisateurRepository.findByLoginLdap(login)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + login));
    }

    @Transactional(readOnly = true)
    public boolean verifierIntegriteChaine() {
        List<JournalMouvement> journaux = journalMouvementRepository
                .findAllByOrderByDateMouvementAscIdAsc();
        String expectedPreviousHash = "0";
        for (JournalMouvement j : journaux) {
            LigneMouvement ligne = hashChainService.getPremiereLigne(j);

            String storedPrevious = j.getPreviousHash() != null ? j.getPreviousHash() : "0";
            if (!storedPrevious.equals(expectedPreviousHash)) {
                log.error("Rupture de chaîne au mouvement {} : previousHash attendu={}, stocké={}",
                        j.getCodeUnique(), expectedPreviousHash, storedPrevious);
                return false;
            }

            String calcHash = hashChainService.calculerHash(j, ligne, storedPrevious);
            if (!calcHash.equals(j.getHashChaine())) {
                log.error("INTÉGRITÉ ROMPUE pour le mouvement id={} code={}", j.getId(), j.getCodeUnique());
                return false;
            }
            expectedPreviousHash = j.getHashChaine();
        }
        return true;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> verifierIntegriteMouvement(Long id) {
        JournalMouvement journal = journalMouvementRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Mouvement introuvable : " + id));

        String previousHash = journal.getPreviousHash() != null ? journal.getPreviousHash() : "0";
        LigneMouvement ligne = hashChainService.getPremiereLigne(journal);
        String hashCalcule = hashChainService.calculerHash(journal, ligne, previousHash);
        boolean integre = hashCalcule.equals(journal.getHashChaine());

        log.info("Vérification mouvement {} : stocké={}, recalculé={}, integre={}",
                journal.getCodeUnique(), journal.getHashChaine(), hashCalcule, integre);

        Map<String, Object> result = new HashMap<>();
        result.put("id", id);
        result.put("codeUnique", journal.getCodeUnique());
        result.put("integrite", integre);
        result.put("hashStocke", journal.getHashChaine());
        result.put("hashCalcule", hashCalcule);
        result.put("previousHash", previousHash);
        return result;
    }

    /*

     */




    @Transactional
    public void regenererTousLesHash() {
        List<JournalMouvement> journaux = journalMouvementRepository
                .findAllByOrderByDateMouvementAscIdAsc();
        String previousHash = "0";
        for (JournalMouvement j : journaux) {
            LigneMouvement ligne = hashChainService.getPremiereLigne(j);
            String hash = hashChainService.calculerHash(j, ligne, previousHash);
            journalMouvementRepository.updateHashChaineAndPreviousHash(j.getId(), hash, previousHash);
            previousHash = hash;
        }
        log.info("Migration terminée : {} mouvements mis à jour.", journaux.size());
    }






}