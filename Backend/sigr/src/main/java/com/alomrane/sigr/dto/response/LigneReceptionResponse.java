package com.alomrane.sigr.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LigneReceptionResponse {
    private Long id;
    private Long produitId;
    private String codeArticle;
    private String designation;
    private int quantiteCommandee;
    private int quantiteRecue;
    private BigDecimal prixUnitaireHT;
    private BigDecimal tva;
    private BigDecimal totalHT;
    private BigDecimal totalTTC;
    private BigDecimal pmpAvant;
    private BigDecimal pmpApres;
    private BigDecimal stockAvant;
    private BigDecimal stockApres;
}