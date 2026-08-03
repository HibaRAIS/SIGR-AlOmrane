package com.alomrane.sigr.dto.request;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProduitFormRequest {
    private String code;
    private String name;
    private String categoryPath;  // "Catégorie > Sous‑catégorie"
    private String location;
    private int currentStock;
    private int minThreshold;
    private BigDecimal prixUnitaireHT;
    private int tvaPercent;
    private BigDecimal pmp;
    private String imageUrl;
    private String description;
    private String weight;
    private String dimensions;
    private String material;
    private String safetyInstructions;
    private boolean consignable;
    private String supplier;
    private int warrantyMonths;
    private String motif;
    private BigDecimal prixAchatHT;
}