package com.alomrane.sigr.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class LigneCommandeResponse {
    private Long id;
    private String codeArticle;
    private String designation;
    private int quantite;
    private BigDecimal prixUnitaireHT;
    private BigDecimal tauxTVA;
    private BigDecimal totalHT;
    private BigDecimal totalTTC;
}
