package com.alomrane.sigr.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LigneReliquatResponse {
    private Long produitId;
    private String designation;
    private String reference;
    private int quantiteInitiale;
    private int quantiteRestante;
    private BigDecimal prixUnitaireHT;
    private BigDecimal tva;
}