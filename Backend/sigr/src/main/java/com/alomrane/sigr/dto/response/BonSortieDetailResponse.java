package com.alomrane.sigr.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record BonSortieDetailResponse(
        Long id,
        LocalDateTime dateSortie,
        String statut,
        String observationsGlobales,
        List<SignatureResponse> signatures,
        List<LigneSortieDetailResponse> lignes
) {}