package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.request.*;
import com.alomrane.sigr.dto.response.*;
import com.alomrane.sigr.model.*;
import com.alomrane.sigr.model.enums.*;
import com.alomrane.sigr.repository.*;
import com.alomrane.sigr.exception.BusinessException;
import com.alomrane.sigr.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SortieService {

    private final DemandeInterneRepository demandeRepo;
    private final BonSortieRepository bonSortieRepo;
    private final LigneSortieRepository ligneSortieRepo;
    private final StockPhysiqueRepository stockRepo;
    private final ProduitRepository produitRepo;
    private final MouvementService mouvementService;
    private final UtilisateurRepository utilisateurRepo;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    // ────── Récupération des demandes pour le responsable ────────
    @Transactional(readOnly = true)
    public List<DemandeResponseResponsable> getDemandesPourResponsable(String statut, String priorite, String search){
        List<DemandeInterne> demandes;
        if (statut != null && !statut.isEmpty()) {
            StatutDemande st = StatutDemande.valueOf(statut.toUpperCase());
            demandes = demandeRepo.findByStatutOrderByDateDemandeDesc(st);
        } else {
            demandes = demandeRepo.findByStatutNotIn(List.of(StatutDemande.EN_VALIDATION));
        }

        if (priorite != null && !priorite.isEmpty()) {
            PrioriteDemande p = PrioriteDemande.valueOf(priorite.toUpperCase());
            demandes = demandes.stream().filter(d -> d.getPriorite() == p).collect(Collectors.toList());
        }
        if (search != null && !search.isEmpty()) {
            String s = search.toLowerCase();
            demandes = demandes.stream().filter(d ->
                    d.getNumeroDemande().toLowerCase().contains(s) ||
                            (d.getEmploye() != null &&
                                    (d.getEmploye().getPrenom() + " " + d.getEmploye().getNom()).toLowerCase().contains(s)) ||
                            (d.getEmploye() != null && d.getEmploye().getStructure() != null &&
                                    d.getEmploye().getStructure().getNom().toLowerCase().contains(s))
            ).collect(Collectors.toList());
        }
        return demandes.stream()
                .map(this::toDemandeResponseResponsable)
                .collect(Collectors.toList());
    }

    private DemandeResponseResponsable toDemandeResponseResponsable(DemandeInterne d) {
        List<DemandeResponse.LigneResponse> lignes = d.getLignes().stream().map(l ->
                new DemandeResponse.LigneResponse(
                        l.getId(),
                        l.getProduit().getId(),
                        l.getProduit().getDesignation(),
                        l.getProduit().getCodeArticle(),
                        l.getQuantiteDemandee().intValue(),
                        l.getQuantiteAccordee().intValue()
                )).toList();

        String valideParNom = d.getValidePar() != null ?
                d.getValidePar().getEmploye().getPrenom() + " " + d.getValidePar().getEmploye().getNom() : null;
        Long valideParId = d.getValidePar() != null ? d.getValidePar().getId() : null;
        String valideParLogin = d.getValidePar() != null ? d.getValidePar().getLoginLdap() : null;

        return new DemandeResponseResponsable(
                d.getId(),
                d.getNumeroDemande(),
                d.getStatut().name(),
                d.getPriorite().name(),
                d.getMotif(),
                d.getDateDemande().toString(),
                d.getEmploye().getPrenom() + " " + d.getEmploye().getNom(),
                d.getEmploye().getStructure().getNom(),
                lignes,
                valideParNom,
                d.getDateValidation() != null ? d.getDateValidation().toString() : null,
                d.getMotifRejet(),
                d.getAnnotation(),
                valideParId,
                valideParLogin
        );
    }

    // ────── Détail complet d’une demande (avec stock, PMP, validations, bon de sortie) ──
    @Transactional(readOnly = true)
    public DemandeDetailResponse getDemandeDetail(Long demandeId) {
        DemandeInterne demande = demandeRepo.findByIdWithDetails(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable"));

        // Circuit d'approbation (chef hiérarchique = valideur)
        List<ValidationInfoResponse> validations = new ArrayList<>();
        if (demande.getValideur() != null) {
            validations.add(new ValidationInfoResponse(
                    "Chef Hiérarchique",
                    demande.getValideur().getPrenom() + " " + demande.getValideur().getNom(),
                    demande.getDateValidation() != null ? demande.getDateValidation().toString() : null
            ));
        }

        // Lignes de la demande avec stock et PMP
        List<LigneDetailResponse> lignesDetail = new ArrayList<>();
        for (LigneDemande ligne : demande.getLignes()) {
            Produit produit = ligne.getProduit();
            StockPhysique stock = produit.getStockPhysique();
            int stockDispo = stock != null ? stock.getQuantiteTheorique().intValue() : 0;
            BigDecimal pmp = stock != null ? stock.getPmpActuel() : BigDecimal.ZERO;

            Integer quantiteServie = null;
            String obsLigne = null;
            // Chercher une ligne de sortie correspondante dans le dernier bon EN_PREPARATION ou VALIDE
            Optional<BonSortie> dernierBon = demande.getBonsSortie().stream()
                    .filter(b -> b.getStatut() == StatutSortie.EN_PREPARATION || b.getStatut() == StatutSortie.VALIDE)
                    .max(Comparator.comparing(BonSortie::getDateSortie));
            if (dernierBon.isPresent()) {
                LigneSortie ls = dernierBon.get().getLignes().stream()
                        .filter(l -> l.getProduit().getId().equals(produit.getId()))
                        .findFirst().orElse(null);
                if (ls != null) {
                    quantiteServie = ls.getQuantiteSortie().intValue();
                    obsLigne = ls.getObservation();
                }
            }
            lignesDetail.add(new LigneDetailResponse(
                    ligne.getId(),
                    produit.getId(),
                    produit.getCodeArticle(),
                    produit.getDesignation(),
                    ligne.getQuantiteDemandee().intValue(),
                    ligne.getQuantiteAccordee().intValue(),
                    stockDispo,
                    pmp,
                    quantiteServie,
                    obsLigne
            ));
        }

        // Bon de sortie associé (le dernier EN_PREPARATION ou VALIDE)
        BonSortieInfoResponse bonSortieInfo = null;
        Optional<BonSortie> dernierBon = demande.getBonsSortie().stream()
                .filter(b -> b.getStatut() == StatutSortie.EN_PREPARATION || b.getStatut() == StatutSortie.VALIDE)
                .max(Comparator.comparing(BonSortie::getDateSortie));
        if (dernierBon.isPresent()) {
            BonSortie bon = dernierBon.get();
            List<LigneSortieInfoResponse> lignesSortie = bon.getLignes().stream().map(ls -> {
                LigneDemande ligneDemande = demande.getLignes().stream()
                        .filter(ld -> ld.getProduit().getId().equals(ls.getProduit().getId()))
                        .findFirst().orElse(null);
                return new LigneSortieInfoResponse(
                        ls.getId(),
                        ls.getProduit().getCodeArticle(),
                        ls.getProduit().getDesignation(),
                        ligneDemande != null ? ligneDemande.getQuantiteAccordee().intValue() : 0,
                        ls.getQuantiteSortie().intValue(),
                        ls.getObservation()
                );
            }).collect(Collectors.toList());
            bonSortieInfo = new BonSortieInfoResponse(
                    bon.getId(),
                    bon.getStatut().name(),
                    bon.getDateSortie().toString(),
                    lignesSortie
            );
        }

        String obsPreparation = dernierBon.map(BonSortie::getObservations).orElse(null);

        return new DemandeDetailResponse(
                demande.getId(),
                demande.getNumeroDemande(),
                demande.getStatut().name(),
                demande.getPriorite().name(),
                demande.getMotif(),
                demande.getDateDemande().toString(),
                demande.getEmploye().getPrenom() + " " + demande.getEmploye().getNom(),
                demande.getEmploye().getStructure().getNom(),
                demande.getValidePar() != null
                        ? demande.getValidePar().getEmploye().getPrenom() + " " + demande.getValidePar().getEmploye().getNom()
                        : null,
                demande.getDateValidation() != null ? demande.getDateValidation().toString() : null,
                demande.getMotifRejet(),
                demande.getAnnotation(),
                obsPreparation,
                lignesDetail,
                validations,
                bonSortieInfo,
                demande.getScanAccuseDataUrl()
        );
    }

    // ────── Refus par le responsable logistique ─────────────────
    public DemandeResponse refuserDemande(Long demandeId, String motif, Utilisateur user) {
        Utilisateur utilisateurComplet = utilisateurRepo.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        DemandeInterne demande = demandeRepo.findById(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable"));
        if (demande.getStatut() != StatutDemande.VALIDEE) {
            throw new BusinessException("Seules les demandes validées peuvent être refusées");
        }

        demande.refuser(motif);
        demande.setValidePar(utilisateurComplet);
        demande.setDateValidation(LocalDateTime.now());
        demandeRepo.save(demande);

        envoyerNotificationAuDemandeur(demande,
                Notification.TypeNotification.ERROR,
                "Demande refusée",
                "Votre demande " + demande.getNumeroDemande() + " a été refusée par le responsable logistique",
                "Motif : " + motif,
                "/dashboard/suivi?id=" + demande.getId());

        log.info("Demande {} refusée par le responsable logistique {}", demande.getNumeroDemande(), user.getLoginLdap());
        return toDemandeResponse(demande);
    }

    // ────── Lancement de la préparation (création du bon) ──────────────────────────
    public BonSortieDetailResponse preparerSortie(Long demandeId, Utilisateur user) {
        DemandeInterne demande = demandeRepo.findById(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable"));
        if (demande.getStatut() != StatutDemande.VALIDEE) {
            throw new BusinessException("La demande doit être validée pour être préparée");
        }

        BonSortie bon = BonSortie.builder()
                .dateSortie(LocalDateTime.now())
                .statut(StatutSortie.EN_PREPARATION)
                .demande(demande)
                .utilisateur(user)
                .build();
        bon = bonSortieRepo.save(bon);

        for (LigneDemande ligne : demande.getLignes()) {
            LigneSortie ls = LigneSortie.builder()
                    .bonSortie(bon)
                    .produit(ligne.getProduit())
                    .quantiteSortie(ligne.getQuantiteAccordee())
                    .observation("")
                    .build();
            ligneSortieRepo.save(ls);
        }

        // Le statut de la demande reste VALIDEE – il changera lors de la sauvegarde
        log.info("Bon de sortie {} créé pour la demande {} par le responsable {}", bon.getId(), demande.getNumeroDemande(), user.getLoginLdap());
        return toBonSortieDetailResponse(bon);
    }

    // ────── Détail d'un bon de sortie ──────────────────────────
    @Transactional(readOnly = true)
    public BonSortieDetailResponse getBonSortieDetail(Long bonId) {
        BonSortie bon = bonSortieRepo.findById(bonId)
                .orElseThrow(() -> new ResourceNotFoundException("Bon de sortie introuvable"));
        return toBonSortieDetailResponse(bon);
    }

    // ────── Sauvegarde de la préparation ───────────────────────
    public BonSortieDetailResponse mettreAJourPreparation(Long bonId, PreparationRequest request) {
        BonSortie bon = bonSortieRepo.findById(bonId)
                .orElseThrow(() -> new ResourceNotFoundException("Bon de sortie introuvable"));
        if (bon.getStatut() != StatutSortie.EN_PREPARATION) {
            throw new BusinessException("Le bon n'est plus modifiable");
        }

        bon.setObservations(request.observationsGlobales());

        DemandeInterne demande = bon.getDemande();

        for (LignePreparationRequest lr : request.lignes()) {
            LigneSortie ligne = bon.getLignes().stream()
                    .filter(l -> l.getId().equals(lr.ligneSortieId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Ligne de sortie introuvable"));

            // Récupérer la ligne de demande correspondante pour obtenir la quantité accordée
            LigneDemande ligneDemande = demande.getLignes().stream()
                    .filter(ld -> ld.getProduit().getId().equals(ligne.getProduit().getId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Ligne de demande correspondante introuvable"));

            BigDecimal maxAutorise = ligneDemande.getQuantiteAccordee();
            BigDecimal nouvelleQte = BigDecimal.valueOf(lr.quantiteServie());

            if (nouvelleQte.compareTo(maxAutorise) > 0) {
                throw new BusinessException("Quantité servie supérieure à la quantité accordée (" + maxAutorise + ")");
            }

            ligne.setQuantiteSortie(nouvelleQte);
            ligne.setObservation(lr.observation());
        }

        bonSortieRepo.save(bon);

        // Passer la demande en EN_PREPARATION si elle était encore VALIDEE
        if (demande.getStatut() == StatutDemande.VALIDEE) {
            demande.lancerPreparation();
            demandeRepo.save(demande);
            envoyerNotificationAuDemandeur(demande,
                    Notification.TypeNotification.INFO,
                    "Préparation en cours",
                    "Votre demande " + demande.getNumeroDemande() + " est en cours de préparation",
                    "Le responsable logistique prépare vos articles.",
                    "/dashboard/suivi?id=" + demande.getId());
        }

        log.info("Préparation du bon {} sauvegardée, demande {}", bonId, demande.getNumeroDemande());
        return toBonSortieDetailResponse(bon);
    }

    // ────── Enregistrement des signatures (brouillon) ──────────
    public BonSortieDetailResponse enregistrerSignatures(Long bonId, List<SignatureRequest> signatures) {
        BonSortie bon = bonSortieRepo.findById(bonId)
                .orElseThrow(() -> new ResourceNotFoundException("Bon introuvable"));
        bon.setSignaturesJson(convertSignaturesToJson(signatures));
        bonSortieRepo.save(bon);
        return toBonSortieDetailResponse(bon);
    }

    // ────── Livraison finale (validation, stock, mouvements, signatures) ──
    public AccuseResponse livrerSortie(Long bonId, LivraisonRequest request, Utilisateur user) {
        BonSortie bon = bonSortieRepo.findById(bonId)
                .orElseThrow(() -> new ResourceNotFoundException("Bon introuvable"));
        if (bon.getStatut() != StatutSortie.EN_PREPARATION) {
            throw new BusinessException("Le bon n'est pas en préparation");
        }

        DemandeInterne demande = bon.getDemande();

        // Vérification des stocks
        for (LigneSortie ls : bon.getLignes()) {
            Produit produit = ls.getProduit();
            StockPhysique stock = produit.getStockPhysique();
            if (stock == null || stock.getQuantiteTheorique().compareTo(ls.getQuantiteSortie()) < 0) {
                throw new BusinessException("Stock insuffisant pour " + produit.getDesignation());
            }
        }

        // Mise à jour du stock et génération des mouvements
        for (LigneSortie ls : bon.getLignes()) {
            Produit produit = ls.getProduit();
            StockPhysique stock = produit.getStockPhysique();

            BigDecimal qteSortieBD = ls.getQuantiteSortie();
            int qteSortieInt = qteSortieBD.intValue();
            BigDecimal stockAvant = stock.getQuantiteTheorique();
            BigDecimal stockApres = stockAvant.subtract(qteSortieBD);

            stock.setQuantiteTheorique(stockApres);
            stock.setCumulSortie(stock.getCumulSortie().add(qteSortieBD));
            stock.setDateDerniereSortie(LocalDateTime.now().toLocalDate());
            stockRepo.save(stock);

            mouvementService.enregistrer(
                    produit,
                    TypeMouvement.SORTIE,
                    qteSortieInt,
                    stock.getPmpActuel(),
                    "Livraison demande " + demande.getNumeroDemande(),
                    user.getLoginLdap(),
                    stockApres,
                    demande.getNumeroDemande()
            );
        }

        // Validation du bon
        bon.setStatut(StatutSortie.VALIDE);
        bon.setNomReceptionnaire(request.nomReceptionnaire());
        if (request.signatures() != null) {
            bon.setSignaturesJson(convertSignaturesToJson(request.signatures()));
        }
        bonSortieRepo.save(bon);

        // Marquer la demande comme livrée
        demande.marquerLivree();
        demande.setSignaturesJson(bon.getSignaturesJson());
        demandeRepo.save(demande);

        envoyerNotificationAuDemandeur(demande,
                Notification.TypeNotification.SUCCESS,
                "Livraison effectuée",
                "Votre demande " + demande.getNumeroDemande() + " a été livrée",
                "Vous pouvez consulter l'accusé de réception.",
                "/dashboard/suivi?id=" + demande.getId());

        log.info("Livraison effectuée pour le bon {} (demande {}) par le responsable {}", bonId, demande.getNumeroDemande(), user.getLoginLdap());
        return buildAccuseResponse(demande, bon);
    }

    // ────── Accusé de réception (données) – prend en compte le dernier bon même EN_PREPARATION ──
    @Transactional(readOnly = true)
    public AccuseResponse getAccuseData(Long demandeId) {
        DemandeInterne demande = demandeRepo.findByIdWithDetails(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable"));
        BonSortie dernierBon = demande.getBonsSortie().stream()
                .filter(b -> b.getStatut() == StatutSortie.EN_PREPARATION || b.getStatut() == StatutSortie.VALIDE)
                .max(Comparator.comparing(BonSortie::getDateSortie))
                .orElse(null);
        return buildAccuseResponse(demande, dernierBon);
    }

    // ────── Upload scan d'accusé ────────────────────────────
    public void uploadScanAccuse(Long demandeId, MultipartFile file) {
        DemandeInterne demande = demandeRepo.findById(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable"));
        try {
            byte[] bytes = file.getBytes();
            String base64 = Base64.getEncoder().encodeToString(bytes);
            String dataUrl = "data:" + file.getContentType() + ";base64," + base64;
            demande.setScanAccuseDataUrl(dataUrl);
            demandeRepo.save(demande);
        } catch (IOException e) {
            throw new RuntimeException("Erreur de lecture du fichier", e);
        }
    }

    // ══════════════════════════════════════════════════════════
    // Méthodes privées (mappings, notifications, JSON)
    // ══════════════════════════════════════════════════════════

    // Correction dans toDemandeResponse
    private DemandeResponse toDemandeResponse(DemandeInterne d) {
        List<DemandeResponse.LigneResponse> lignes = d.getLignes().stream().map(l ->
                new DemandeResponse.LigneResponse(
                        l.getId(),
                        l.getProduit().getId(),
                        l.getProduit().getDesignation(),
                        l.getProduit().getCodeArticle(),
                        l.getQuantiteDemandee().intValue(),
                        l.getQuantiteAccordee().intValue()
                )).toList();

        String valideParNom = d.getValidePar() != null ?
                d.getValidePar().getEmploye().getPrenom() + " " + d.getValidePar().getEmploye().getNom() : null;
        String valideParLogin = d.getValidePar() != null ? d.getValidePar().getLoginLdap() : null;
        Long valideParId = d.getValidePar() != null ? d.getValidePar().getId() : null;

        return new DemandeResponse(
                d.getId(),
                d.getNumeroDemande(),
                d.getStatut().name(),
                d.getPriorite().name(),
                d.getMotif(),
                d.getDateDemande().toString(),
                d.getEmploye().getPrenom() + " " + d.getEmploye().getNom(),
                d.getEmploye().getStructure().getNom(),
                lignes,
                valideParNom,
                d.getDateValidation() != null ? d.getDateValidation().toString() : null,
                d.getMotifRejet(),
                d.getAnnotation()
        );
    }

    private BonSortieDetailResponse toBonSortieDetailResponse(BonSortie bon) {
        List<LigneSortieDetailResponse> lignes = bon.getLignes().stream().map(l -> {
            LigneDemande ligneDemande = bon.getDemande().getLignes().stream()
                    .filter(ld -> ld.getProduit().getId().equals(l.getProduit().getId()))
                    .findFirst().orElse(null);
            return new LigneSortieDetailResponse(
                    l.getId(),
                    l.getProduit().getCodeArticle(),
                    l.getProduit().getDesignation(),
                    ligneDemande != null ? ligneDemande.getQuantiteDemandee().intValue() : 0,
                    ligneDemande != null ? ligneDemande.getQuantiteAccordee().intValue() : 0,
                    l.getQuantiteSortie().intValue(),
                    l.getObservation()
            );
        }).toList();

        List<SignatureResponse> signatures = parseSignaturesFromJson(bon.getSignaturesJson());

        return new BonSortieDetailResponse(
                bon.getId(),
                bon.getDateSortie(),
                bon.getStatut().name(),
                bon.getObservations(),
                signatures,
                lignes
        );
    }

    private AccuseResponse buildAccuseResponse(DemandeInterne demande, BonSortie bon) {
        List<LignePreparationResponse> lignes;
        List<SignatureResponse> signatures = List.of();

        if (bon != null) {
            lignes = bon.getLignes().stream().map(ls -> {
                LigneDemande ligneDemande = demande.getLignes().stream()
                        .filter(ld -> ld.getProduit().getId().equals(ls.getProduit().getId()))
                        .findFirst().orElse(null);
                return new LignePreparationResponse(
                        ls.getProduit().getCodeArticle(),
                        ls.getProduit().getDesignation(),
                        ligneDemande != null ? ligneDemande.getQuantiteDemandee().intValue() : 0,
                        ligneDemande != null ? ligneDemande.getQuantiteAccordee().intValue() : 0,
                        ls.getQuantiteSortie().intValue(),
                        ls.getObservation()
                );
            }).toList();
            signatures = parseSignaturesFromJson(bon.getSignaturesJson());
        } else {
            lignes = demande.getLignes().stream().map(l ->
                    new LignePreparationResponse(
                            l.getProduit().getCodeArticle(),
                            l.getProduit().getDesignation(),
                            l.getQuantiteDemandee().intValue(),
                            l.getQuantiteAccordee().intValue(),
                            l.getQuantiteAccordee().intValue(),
                            ""
                    )).toList();
        }

        return new AccuseResponse(
                demande.getId(),
                demande.getNumeroDemande(),
                demande.getEmploye().getPrenom() + " " + demande.getEmploye().getNom(),
                demande.getEmploye().getMatricule(),
                demande.getEmploye().getStructure().getNom(),
                demande.getStatut().name(),
                bon != null && bon.getDateSortie() != null ? bon.getDateSortie().toString() : null,
                demande.getScanAccuseDataUrl(),
                lignes,
                signatures
        );
    }

    private String convertSignaturesToJson(List<SignatureRequest> signatures) {
        try {
            return objectMapper.writeValueAsString(signatures);
        } catch (Exception e) {
            log.error("Erreur de sérialisation des signatures", e);
            return "[]";
        }
    }

    private List<SignatureResponse> parseSignaturesFromJson(String json) {
        if (json == null || json.isEmpty()) return List.of();
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, SignatureResponse.class));
        } catch (Exception e) {
            log.error("Erreur de parsing des signatures", e);
            return List.of();
        }
    }

    private void envoyerNotificationAuDemandeur(DemandeInterne demande,
                                                Notification.TypeNotification type,
                                                String titre,
                                                String message,
                                                String details,
                                                String lien) {
        try {
            Utilisateur demandeurUser = utilisateurRepo.findByEmploye(demande.getEmploye()).orElse(null);
            if (demandeurUser != null) {
                notificationService.envoyerNotification(
                        demandeurUser,
                        type,
                        titre,
                        message,
                        details,
                        lien
                );
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification pour la demande {}", demande.getNumeroDemande(), e);
        }
    }
}