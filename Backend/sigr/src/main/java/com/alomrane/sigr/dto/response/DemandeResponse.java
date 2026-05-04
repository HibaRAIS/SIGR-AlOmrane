package com.alomrane.sigr.dto.response;

import java.util.List;

public record DemandeResponse(
        Long id,
        String numeroDemande,
        String statut,
        String priorite,
        String motif,
        String dateDemande,
        String employeNom,
        String structureNom,
        List<LigneResponse> lignes,
        String validePar,
        String dateValidation,
        String motifRefus,
        String annotation
) {
    public record LigneResponse(
            Long ligneId,
            Long produitId,
            String produitDesignation,
            String produitReference,
            Integer quantiteDemandee,
            Integer quantiteAccordee
    ) {}
}