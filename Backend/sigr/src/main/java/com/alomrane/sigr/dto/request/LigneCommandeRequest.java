package com.alomrane.sigr.dto.request;


import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LigneCommandeRequest {
    private String codeArticle;
    @NotBlank
    private String designation;
    @Min(1) private Integer quantite;
    @DecimalMin("0.0") private BigDecimal prixUnitaireHT;
    @DecimalMin("0.0") @DecimalMax("100.0") private BigDecimal tauxTVA;
}
