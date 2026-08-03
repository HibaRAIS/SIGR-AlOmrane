// LigneDetailResponse.java
package com.alomrane.sigr.dto.response;

import java.math.BigDecimal;

public record LigneDetailResponse(
        Long ligneId,
        Long produitId,
        String produitReference,
        String produitDesignation,
        int quantiteDemandee,
        int quantiteAccordee,
        int stockDisponible,
        BigDecimal pmp,
        Integer quantiteServie,
        String observationLigne
) {}