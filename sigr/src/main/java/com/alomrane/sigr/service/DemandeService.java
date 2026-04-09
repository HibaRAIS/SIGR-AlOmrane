package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.*;
import com.alomrane.sigr.model.*;
import com.alomrane.sigr.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DemandeService {

    private final DemandeInterneRepository demandeRepo;
    private final LigneDemandeRepository ligneRepo;
    private final ProduitRepository produitRepo;

    public DemandeResponse creerDemande(CreerDemandeRequest request, Utilisateur currentUser) {
        Employe expediteur = currentUser.getEmploye();

        // LOGIQUE HIÉRARCHIQUE : On récupère le manager de l'expéditeur
        Employe manager = expediteur.getManager();
        if (manager == null) {
            throw new RuntimeException("Erreur : Aucun manager assigné à votre profil. Validation impossible.");
        }

        DemandeInterne demande = new DemandeInterne();
        demande.setReference(genererReference());
        demande.setEmploye(expediteur);
        demande.setStructure(expediteur.getStructure());
        demande.setValideur(manager); // ON ASSIGNE LE MANAGER ICI
        demande.setJustification(request.justification());
        demande.setUrgence(DemandeInterne.Urgence.valueOf(request.urgence()));
        demande.setStatut(DemandeInterne.Statut.EN_ATTENTE);

        DemandeInterne saved = demandeRepo.save(demande);

        request.lignes().forEach(ligne -> {
            Produit produit = produitRepo.findById(ligne.produitId())
                    .orElseThrow(() -> new RuntimeException("Produit introuvable"));
            LigneDemande ld = new LigneDemande();
            ld.setDemande(saved);
            ld.setProduit(produit);
            ld.setQuantite(ligne.quantite());
            ligneRepo.save(ld);
        });

        return toResponse(saved);
    }

    public List<DemandeResponse> getMesDemandes(Utilisateur currentUser) {
        return demandeRepo
                .findByEmployeIdOrderByDateCreationDesc(currentUser.getEmploye().getId())
                .stream().map(this::toResponse).toList();
    }

    public List<DemandeResponse> getDemandesAValider(Utilisateur currentUser) {
        if (currentUser.getEmploye() == null) {
            throw new RuntimeException("Aucun employé associé à cet utilisateur");
        }
        // FILTRAGE PAR VALIDEUR : Seul le manager désigné voit la demande
        return demandeRepo
                .findByValideurIdAndStatutOrderByDateCreationDesc(
                        currentUser.getEmploye().getId(),
                        DemandeInterne.Statut.EN_ATTENTE
                )
                .stream().map(this::toResponse).toList();
    }

    public DemandeResponse approuver(Long id, Utilisateur currentUser) {
        DemandeInterne demande = demandeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        // SÉCURITÉ : On vérifie que c'est bien le manager assigné qui valide
        if (!demande.getValideur().getId().equals(currentUser.getEmploye().getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à valider cette demande.");
        }

        demande.setStatut(DemandeInterne.Statut.APPROUVEE);
        demande.setValidePar(currentUser);
        demande.setDateValidation(LocalDateTime.now());
        return toResponse(demandeRepo.save(demande));
    }

    public DemandeResponse rejeter(Long id, RejeterDemandeRequest request, Utilisateur currentUser) {
        DemandeInterne demande = demandeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        if (!demande.getValideur().getId().equals(currentUser.getEmploye().getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à rejeter cette demande.");
        }

        demande.setStatut(DemandeInterne.Statut.REFUSEE);
        demande.setValidePar(currentUser);
        demande.setDateValidation(LocalDateTime.now());
        demande.setMotifRefus(request.motifRefus());
        return toResponse(demandeRepo.save(demande));
    }

    // MÉTHODES PRIVÉES (Celles qui manquaient dans votre erreur IntelliJ)

    private String genererReference() {
        int num = (int)(Math.random() * 9000) + 1000;
        return "DEM-" + LocalDateTime.now().getYear() + "-" + num;
    }

    private DemandeResponse toResponse(DemandeInterne d) {
        List<DemandeResponse.LigneResponse> lignes = d.getLignes() == null ? List.of() :
                d.getLignes().stream().map(l -> new DemandeResponse.LigneResponse(
                        l.getProduit().getId(),
                        l.getProduit().getDesignation(),
                        l.getProduit().getReference(),
                        l.getQuantite()
                )).toList();

        String valideParNom = d.getValidePar() == null ? "Non encore validée" :
                d.getValidePar().getEmploye().getPrenom() + " " + d.getValidePar().getEmploye().getNom();

        return new DemandeResponse(
                d.getId(),
                d.getReference(),
                d.getStatut().name(),
                d.getUrgence().name(),
                d.getJustification(),
                d.getDateCreation().toString(),
                d.getEmploye().getPrenom() + " " + d.getEmploye().getNom(),
                d.getStructure().getNom(),
                lignes,
                valideParNom,
                d.getDateValidation() == null ? null : d.getDateValidation().toString(),
                d.getMotifRefus()
        );
    }
}