// BonSortieInfoResponse.java
package com.alomrane.sigr.dto.response;

import java.util.List;

public record BonSortieInfoResponse(
        Long bonId,
        String statut,
        String dateSortie,
        List<LigneSortieInfoResponse> lignesSortie
) {}