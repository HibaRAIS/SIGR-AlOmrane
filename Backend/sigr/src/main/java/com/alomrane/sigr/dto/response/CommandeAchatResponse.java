package com.alomrane.sigr.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class CommandeAchatResponse {
    private Long id;
    private String reference;
    private String description;
    private String objetMarche;
    private String fournisseur;
    private String methode;
    private String numeroMarche;
    private BigDecimal montantMarche;
    private LocalDate dateCommande;
    private String statut;
    private String motifAnnulation;
    private BigDecimal montantHT;
    private BigDecimal montantTTC;
    private LocalDateTime createdAt;
    private List<LigneCommandeResponse> lignes;
    private List<DocumentJointResponse> documents;
}