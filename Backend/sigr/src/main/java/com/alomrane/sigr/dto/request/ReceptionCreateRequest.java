package com.alomrane.sigr.dto.request;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class ReceptionCreateRequest {
    @NotNull(message = "La commande est obligatoire")
    private Long commandeId;

    @NotBlank(message = "Le numéro de bon de livraison est obligatoire")
    private String bonLivraison;

    private String numeroFacture;
    private String codeMarche;

    @NotNull(message = "La date de réception est obligatoire")
    private LocalDate dateReception;

    private String notes;
    private String reliquatSource; // id du reliquat pour les complémentaires

    @NotEmpty(message = "Au moins une ligne est requise")
    private List<LigneReceptionRequest> lignes;

    private List<DocumentJointRequest> documents;
}