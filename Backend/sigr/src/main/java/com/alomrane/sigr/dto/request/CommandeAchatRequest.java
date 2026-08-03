package com.alomrane.sigr.dto.request;

import lombok.Data;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CommandeAchatRequest {
    private String description;
    private String objetMarche;

    @NotBlank(message = "Le fournisseur est obligatoire")
    private String fournisseur;

    @NotNull
    private String methode; // "MARCHE_PUBLIC" ou "BON_COMMANDE"

    private String numeroMarche;
    private BigDecimal montantMarche;
    private LocalDate dateCommande;
    private String statut; // "EN_COURS" ou "RECUE"

    @Valid
    @NotEmpty(message = "Au moins une ligne est requise")
    private List<LigneCommandeRequest> lignes;

    private List<DocumentJointRequest> documents;
}
