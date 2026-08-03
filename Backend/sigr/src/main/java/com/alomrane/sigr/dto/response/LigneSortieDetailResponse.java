package com.alomrane.sigr.dto.response;

public record LigneSortieDetailResponse(
        Long id,
        String produitReference,
        String produitDesignation,
        int quantiteDemandee,
        int quantiteAccordee,
        int quantiteServie,
        String observation
) {}