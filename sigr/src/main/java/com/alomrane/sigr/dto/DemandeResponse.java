package com.alomrane.sigr.dto;

import java.util.List;

public record DemandeResponse(
        Long id,
        String reference,
        String statut,
        String urgence,
        String justification,
        String dateCreation,
        String employeNom,
        String structureNom,
        List<LigneResponse> lignes,
        String validePar,
        String dateValidation,
        String motifRefus
) {
    public record LigneResponse(
            Long produitId,
            String produitDesignation,  // ← était "designation"
            String produitReference,    // ← était "reference"
            Integer quantite
    ) {}
}