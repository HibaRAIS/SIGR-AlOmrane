package com.alomrane.sigr.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateEmployeRequest {
    @NotBlank @Size(min = 1)
    private String matricule;

    private String badge;

    @NotBlank @Size(min = 1)
    private String nom;

    @NotBlank @Size(min = 1)
    private String prenom;

    @NotBlank
    private String emailProfessionnel;

    private String telephone;

    @NotBlank
    private String grade;  // ex: DIRECTEUR, CHEF_DIVISION...

    private LocalDate dateEmbauche;

    private Long structureId;

    private Long managerId;

    // =================================================================
    // SETTERS PERSONNALISÉS (Lombok utilisera ceux-là automatiquement)
    // =================================================================

    public void setBadge(String badge) {
        // Si le frontend envoie "", on force à null
        if (badge != null && badge.trim().isEmpty()) {
            this.badge = null;
        } else {
            this.badge = badge;
        }
    }

    public void setTelephone(String telephone) {
        // Même sécurité pour le téléphone au cas où il serait unique plus tard !
        if (telephone != null && telephone.trim().isEmpty()) {
            this.telephone = null;
        } else {
            this.telephone = telephone;
        }
    }
}