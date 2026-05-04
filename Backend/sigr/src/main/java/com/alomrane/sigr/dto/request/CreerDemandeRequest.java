package com.alomrane.sigr.dto.request;

import java.util.List;

public record CreerDemandeRequest(
        String motif,
        String priorite,
        List<LigneRequest> lignes
) {
    public record LigneRequest(Long produitId, Integer quantite) {}
}