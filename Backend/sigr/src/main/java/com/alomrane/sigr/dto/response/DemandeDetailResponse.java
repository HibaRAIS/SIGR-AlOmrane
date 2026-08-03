// DemandeDetailResponse.java
package com.alomrane.sigr.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record DemandeDetailResponse(
        Long id,
        String numeroDemande,
        String statut,
        String priorite,
        String motif,
        String dateDemande,
        String employeNom,
        String structureNom,
        String validePar,
        String dateValidation,
        String motifRefus,
        String annotation,
        String observationsPreparation,
        List<LigneDetailResponse> lignes,
        List<ValidationInfoResponse> validations,
        BonSortieInfoResponse bonSortie,
        String scanAccuseDataUrl
) {}