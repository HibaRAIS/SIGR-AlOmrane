package com.alomrane.sigr.dto.request;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AjustementRequest {
    private int nouvelleQuantite;
    private String motif;
    private BigDecimal prixUnitaire;  // optionnel
}