package com.alomrane.sigr.dto.response;

import java.util.List;

public record AccuseResponse(
        Long demandeId,
        String demandeReference,
        String employeNom,
        String matriculeDemandeur,
        String structureNom,
        String statut,
        String dateLivraison,
        String scanAccuseDataUrl,
        List<LignePreparationResponse> lignes,
        List<SignatureResponse> signatures
) {}