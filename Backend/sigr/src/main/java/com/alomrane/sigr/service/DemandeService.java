package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.request.AjusterDemandeRequest;
import com.alomrane.sigr.dto.request.AnnoterDemandeRequest;
import com.alomrane.sigr.dto.request.CreerDemandeRequest;
import com.alomrane.sigr.dto.request.RejeterDemandeRequest;
import com.alomrane.sigr.dto.response.DemandeResponse;
import com.alomrane.sigr.exception.BusinessException;
import com.alomrane.sigr.exception.ResourceNotFoundException;
import com.alomrane.sigr.model.*;
import com.alomrane.sigr.model.enums.PrioriteDemande;
import com.alomrane.sigr.model.enums.StatutDemande;
import com.alomrane.sigr.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DemandeService {

    private final DemandeInterneRepository demandeRepo;
    private final LigneDemandeRepository ligneRepo;
    private final ProduitRepository produitRepo;
    private final StockPhysiqueRepository stockRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final EmployeRepository employeRepo;
    private final NotificationService notificationService;

    public DemandeResponse creerDemande(CreerDemandeRequest request, Utilisateur currentUser) {
        log.debug("Création d'une demande par l'utilisateur {}", currentUser.getLoginLdap());

        Utilisateur managedUser = utilisateurRepo.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        Employe expediteur = employeRepo.findById(managedUser.getEmploye().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employé introuvable"));

        if (request.lignes() == null || request.lignes().isEmpty()) {
            throw new BusinessException("La demande doit contenir au moins un article");
        }
        for (var ligneReq : request.lignes()) {
            if (ligneReq.quantite() <= 0) {
                throw new BusinessException("La quantité doit être supérieure à zéro");
            }
            if (!produitRepo.existsById(ligneReq.produitId())) {
                throw new ResourceNotFoundException("Produit introuvable: " + ligneReq.produitId());
            }
        }

        StatutDemande statutInitial;
        Employe valideur = null;

        if (expediteur.getManager() != null) {
            valideur = employeRepo.findById(expediteur.getManager().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager introuvable"));
            statutInitial = StatutDemande.EN_VALIDATION;
        } else {
            statutInitial = StatutDemande.VALIDEE;
            log.info("Aucun manager pour l'employé {} – demande auto-validée", expediteur.getPrenom() + " " + expediteur.getNom());
        }

        DemandeInterne demande = DemandeInterne.builder()
                .numeroDemande(genererReference())
                .dateDemande(LocalDateTime.now())
                .priorite(PrioriteDemande.valueOf(request.priorite()))
                .motif(request.motif())
                .statut(statutInitial)
                .employe(expediteur)
                .valideur(valideur)
                .build();
        demande = demandeRepo.save(demande);

        for (var ligneReq : request.lignes()) {
            Produit produit = produitRepo.findById(ligneReq.produitId()).get();
            BigDecimal qte = BigDecimal.valueOf(ligneReq.quantite());
            LigneDemande ligne = LigneDemande.builder()
                    .demande(demande)
                    .produit(produit)
                    .quantiteDemandee(qte)
                    .quantiteAccordee(qte)   // ← initialisée à la quantité demandée
                    .build();
            demande.getLignes().add(ligne);
            ligneRepo.save(ligne);
        }

        // Variables finales pour la lambda
        final Employe expediteurFinal = expediteur;
        final DemandeInterne demandeFinale = demande;
        final String numeroDemande = demande.getNumeroDemande();
        final String motifDemande = demande.getMotif();

        // ----- NOTIFICATION -----
        try {
            if (valideur != null) {
                utilisateurRepo.findByEmploye(valideur).ifPresent(managerUser -> {
                    notificationService.envoyerNotification(
                            managerUser,
                            Notification.TypeNotification.INFO,
                            "Nouvelle demande à valider",
                            expediteurFinal.getPrenom() + " " + expediteurFinal.getNom() + " a soumis une demande",
                            "N° " + numeroDemande + " - Motif : " + motifDemande,
                            "/chef/demandes"
                    );
                });
            } else {
                notificationService.envoyerNotification(
                        managedUser,
                        Notification.TypeNotification.SUCCESS,
                        "Demande auto-validée",
                        "Votre demande " + numeroDemande + " a été automatiquement validée",
                        "Elle sera traitée par le magasinier.",
                        "/dashboard/suivi?id=" + demandeFinale.getId()
                );
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification", e);
        }

        log.info("Demande créée : {} (statut: {})", demande.getNumeroDemande(), demande.getStatut());
        return toResponse(demande);
    }

    public List<DemandeResponse> getMesDemandes(Utilisateur currentUser) {
        Utilisateur managedUser = utilisateurRepo.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Long employeId = managedUser.getEmploye().getId();
        return demandeRepo.findByEmployeIdOrderByDateDemandeDesc(employeId)
                .stream().map(this::toResponse).toList();
    }

    public List<DemandeResponse> getDemandesAValider(Utilisateur currentUser) {
        Utilisateur managedUser = utilisateurRepo.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Long valideurId = managedUser.getEmploye().getId();
        return demandeRepo.findByValideurIdAndStatutOrderByDateDemandeDesc(valideurId, StatutDemande.EN_VALIDATION)
                .stream().map(this::toResponse).toList();
    }

    public DemandeResponse approuver(Long id, Utilisateur validateur) {
        log.debug("Approbation de la demande {} par {}", id, validateur.getLoginLdap());

        Utilisateur managedValidateur = utilisateurRepo.findById(validateur.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Long validateurEmployeId = managedValidateur.getEmploye().getId();

        DemandeInterne demande = demandeRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable"));

        if (demande.getValideur() == null) {
            throw new BusinessException("Cette demande n'a pas de valideur assigné (auto-validée)");
        }
        if (!demande.getValideur().getId().equals(validateurEmployeId)) {
            throw new BusinessException("Vous n'êtes pas autorisé à valider cette demande");
        }
        if (demande.getStatut() != StatutDemande.EN_VALIDATION) {
            throw new BusinessException("Cette demande n'est plus en attente de validation");
        }

        // Réservation du stock basée sur la quantité accordée (ajustée)
        for (LigneDemande ligne : demande.getLignes()) {
            Produit produit = ligne.getProduit();
            StockPhysique stock = produit.getStockPhysique();
            if (stock == null) {
                log.error("Stock physique manquant pour le produit {} - création d'urgence", produit.getId());
                stock = StockPhysique.builder()
                        .produit(produit)
                        .quantiteTheorique(BigDecimal.ZERO)
                        .quantiteReservee(BigDecimal.ZERO)
                        .pmpActuel(BigDecimal.ZERO)
                        .cumulEntree(BigDecimal.ZERO)
                        .cumulSortie(BigDecimal.ZERO)
                        .build();
                stock = stockRepo.save(stock);
                produit.setStockPhysique(stock);
                produitRepo.save(produit);
            }
            BigDecimal qteAccordee = ligne.getQuantiteAccordee();
            stock.setQuantiteReservee(stock.getQuantiteReservee().add(qteAccordee));
            stockRepo.save(stock);
            // Ne pas modifier ligne.setQuantiteAccordee – elle est déjà correcte
        }

        demande.valider();
        demande.setValidePar(managedValidateur);
        demande.setDateValidation(LocalDateTime.now());
        DemandeInterne saved = demandeRepo.save(demande);


        // ----- NOTIFICATION -----
        try {
            utilisateurRepo.findByEmploye(saved.getEmploye()).ifPresent(demandeurUser -> {
                notificationService.envoyerNotification(
                        demandeurUser,
                        Notification.TypeNotification.SUCCESS,
                        "Demande approuvée",
                        "Votre demande " + saved.getNumeroDemande() + " a été approuvée par " + managedValidateur.getEmploye().getPrenom() + " " + managedValidateur.getEmploye().getNom(),
                        "Les articles seront préparés par le magasinier.",
                        "/dashboard/suivi?id=" + saved.getId()
                );
            });
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification", e);
        }


        log.info("Demande {} approuvée", saved.getNumeroDemande());
        return toResponse(saved);
    }

    public DemandeResponse rejeter(Long id, RejeterDemandeRequest request, Utilisateur validateur) {
        log.debug("Rejet de la demande {} par {}", id, validateur.getLoginLdap());

        if (request.motifRefus() == null || request.motifRefus().isBlank()) {
            throw new BusinessException("Le motif de rejet est obligatoire");
        }

        Utilisateur managedValidateur = utilisateurRepo.findById(validateur.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Long validateurEmployeId = managedValidateur.getEmploye().getId();

        DemandeInterne demande = demandeRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable"));

        if (demande.getValideur() == null) {
            throw new BusinessException("Cette demande n'a pas de valideur assigné (auto-validée)");
        }
        if (!demande.getValideur().getId().equals(validateurEmployeId)) {
            throw new BusinessException("Vous n'êtes pas autorisé à rejeter cette demande");
        }
        if (demande.getStatut() != StatutDemande.EN_VALIDATION) {
            throw new BusinessException("Cette demande n'est plus en attente de validation");
        }

        demande.refuser(request.motifRefus());
        demande.setValidePar(managedValidateur);
        demande.setDateValidation(LocalDateTime.now());
        DemandeInterne saved = demandeRepo.save(demande);

        // ----- NOTIFICATION -----
        try {
            utilisateurRepo.findByEmploye(saved.getEmploye()).ifPresent(demandeurUser -> {
                notificationService.envoyerNotification(
                        demandeurUser,
                        Notification.TypeNotification.ERROR,
                        "Demande refusée",
                        "Votre demande " + saved.getNumeroDemande() + " a été refusée",
                        "Motif : " + request.motifRefus(),
                        "/dashboard/suivi?id=" + saved.getId()
                );
            });
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification", e);
        }


        log.info("Demande {} rejetée", saved.getNumeroDemande());
        return toResponse(saved);
    }

    private String genererReference() {
        return "DEM-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private DemandeResponse toResponse(DemandeInterne d) {
        List<DemandeResponse.LigneResponse> lignes = d.getLignes() == null ? List.of() :
                d.getLignes().stream().map(l -> new DemandeResponse.LigneResponse(
                        l.getId(),
                        l.getProduit().getId(),
                        l.getProduit().getDesignation(),
                        l.getProduit().getCodeArticle(),
                        l.getQuantiteDemandee().intValue(),
                        l.getQuantiteAccordee().intValue()
                )).toList();

        String valideParNom = d.getValidePar() == null ? "Non encore validée" :
                d.getValidePar().getEmploye().getPrenom() + " " + d.getValidePar().getEmploye().getNom();

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
                d.getDateValidation() == null ? null : d.getDateValidation().toString(),
                d.getMotifRejet(),
                d.getAnnotation()
        );
    }

    public List<DemandeResponse> getDemandesValidees() {
        return demandeRepo.findByStatutOrderByDateDemandeDesc(StatutDemande.VALIDEE)
                .stream().map(this::toResponse).toList();
    }

    public List<DemandeResponse> getDemandesPourChef(Utilisateur chef, String statut) {
        Utilisateur managedChef = utilisateurRepo.findById(chef.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Long chefEmployeId = managedChef.getEmploye().getId();

        if (statut == null || statut.equalsIgnoreCase("tous")) {
            return demandeRepo.findByValideurIdOrderByDateDemandeDesc(chefEmployeId)
                    .stream().map(this::toResponse).toList();
        } else {
            StatutDemande statutEnum = StatutDemande.valueOf(statut.toUpperCase());
            return demandeRepo.findByValideurIdAndStatutOrderByDateDemandeDesc(chefEmployeId, statutEnum)
                    .stream().map(this::toResponse).toList();
        }
    }

    @Transactional
    public DemandeResponse ajusterQuantites(Long id, AjusterDemandeRequest request, Utilisateur validateur) {
        DemandeInterne demande = demandeRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable"));
        if (!demande.getValideur().getId().equals(validateur.getEmploye().getId()))
            throw new BusinessException("Non autorisé");
        if (demande.getStatut() != StatutDemande.EN_VALIDATION)
            throw new BusinessException("La demande n'est plus en attente");
        for (var ligneReq : request.lignes()) {
            LigneDemande ligne = ligneRepo.findById(ligneReq.ligneId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ligne introuvable"));
            ligne.setQuantiteAccordee(BigDecimal.valueOf(ligneReq.quantiteAccordee()));
            ligneRepo.save(ligne);
        }


        return toResponse(demande);
    }

    @Transactional
    public DemandeResponse annoterDemande(Long id, AnnoterDemandeRequest request, Utilisateur validateur) {
        DemandeInterne demande = demandeRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable"));
        if (!demande.getValideur().getId().equals(validateur.getEmploye().getId()))
            throw new BusinessException("Non autorisé");
        demande.setAnnotation(request.annotation());
        return toResponse(demandeRepo.save(demande));
    }

    // service/DemandeService.java
    @Transactional
    public DemandeResponse modifierDemande(Long id, CreerDemandeRequest request, Utilisateur currentUser) {
        Utilisateur managedUser = utilisateurRepo.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Employe employe = managedUser.getEmploye();
        if (employe == null) throw new BusinessException("Aucun employé associé");

        DemandeInterne demande = demandeRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable"));

        // Vérifier l'appartenance et le statut
        if (!demande.getEmploye().getId().equals(employe.getId())) {
            throw new BusinessException("Vous n'êtes pas autorisé à modifier cette demande");
        }
        if (demande.getStatut() != StatutDemande.EN_VALIDATION) {
            throw new BusinessException("Seules les demandes en attente peuvent être modifiées");
        }

        // Mettre à jour les champs
        demande.setMotif(request.motif());
        demande.setPriorite(PrioriteDemande.valueOf(request.priorite()));

        // Gérer les lignes : supprimer les anciennes et ajouter les nouvelles
        ligneRepo.deleteAll(demande.getLignes());
        demande.getLignes().clear();

        for (var ligneReq : request.lignes()) {
            Produit produit = produitRepo.findById(ligneReq.produitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
            BigDecimal qte = BigDecimal.valueOf(ligneReq.quantite());
            LigneDemande ligne = LigneDemande.builder()
                    .demande(demande)
                    .produit(produit)
                    .quantiteDemandee(qte)
                    .quantiteAccordee(qte)
                    .build();
            demande.getLignes().add(ligne);
            ligneRepo.save(ligne);
        }

        demande = demandeRepo.save(demande);
        log.info("Demande {} modifiée par {}", demande.getNumeroDemande(), employe.getPrenom());
        return toResponse(demande);
    }

    @Transactional
    public void supprimerDemande(Long id, Utilisateur currentUser) {
        Utilisateur managedUser = utilisateurRepo.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Employe employe = managedUser.getEmploye();
        if (employe == null) throw new BusinessException("Aucun employé associé");

        DemandeInterne demande = demandeRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable"));

        if (!demande.getEmploye().getId().equals(employe.getId())) {
            throw new BusinessException("Vous n'êtes pas autorisé à supprimer cette demande");
        }
        if (demande.getStatut() != StatutDemande.EN_VALIDATION) {
            throw new BusinessException("Seules les demandes en attente peuvent être supprimées");
        }

        demandeRepo.delete(demande);
        log.info("Demande {} supprimée par {}", demande.getNumeroDemande(), employe.getPrenom());
    }



}