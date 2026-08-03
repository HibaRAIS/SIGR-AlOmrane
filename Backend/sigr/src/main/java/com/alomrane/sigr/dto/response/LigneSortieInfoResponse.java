// LigneSortieInfoResponse.java
package com.alomrane.sigr.dto.response;

public record LigneSortieInfoResponse(
        Long ligneSortieId,
        String produitReference,
        String produitDesignation,
        int quantiteAccordee,
        int quantiteServie,
        String observation
) {}