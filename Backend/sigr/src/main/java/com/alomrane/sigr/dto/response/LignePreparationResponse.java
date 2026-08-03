package com.alomrane.sigr.dto.response;

public record LignePreparationResponse(
        String produitReference,
        String produitDesignation,
        int quantiteDemandee,
        int quantiteAccordee,
        int quantiteServie,
        String observation
) {}