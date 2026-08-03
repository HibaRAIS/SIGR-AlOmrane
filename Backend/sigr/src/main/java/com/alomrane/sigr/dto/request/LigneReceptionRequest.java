package com.alomrane.sigr.dto.request;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Data
public class LigneReceptionRequest {
    private String codeArticle;

    @NotBlank(message = "La désignation est obligatoire")
    private String designation;

    @NotNull(message = "La quantité commandée est obligatoire")
    @Min(1)
    private Integer quantiteCommandee;

    @NotNull(message = "La quantité reçue est obligatoire")
    @Min(0)
    private Integer quantiteRecue;

    @NotNull(message = "Le prix unitaire HT est obligatoire")
    @DecimalMin("0.0")
    private BigDecimal prixUnitaireHT;

    @NotNull(message = "Le taux de TVA est obligatoire")
    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private BigDecimal tva;
}
