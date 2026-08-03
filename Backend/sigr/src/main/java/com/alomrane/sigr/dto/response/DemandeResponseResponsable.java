package com.alomrane.sigr.dto.response;

import java.util.List;

public record DemandeResponseResponsable(
        Long id,
        String numeroDemande,
        String statut,
        String priorite,
        String motif,
        String dateDemande,
        String employeNom,
        String structureNom,
        List<DemandeResponse.LigneResponse> lignes,
        String validePar,
        String dateValidation,
        String motifRefus,
        String annotation,
        Long valideParId,  // ← seul champ ajouté
        String valideParLogin
) {}