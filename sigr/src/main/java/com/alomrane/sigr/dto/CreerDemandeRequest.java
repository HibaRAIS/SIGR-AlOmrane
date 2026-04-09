package com.alomrane.sigr.dto;

import java.util.List;

public record CreerDemandeRequest(
        String justification,
        String urgence,
        List<LigneRequest> lignes
) {
    public record LigneRequest(Long produitId, Integer quantite) {}
}