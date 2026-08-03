package com.alomrane.sigr.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceptionResponse {
    private Long id;
    private String numero;
    private int tranche;
    private String statut;
    private LocalDate dateReception;
    private String bonLivraison;
    private String numeroFacture;
    private String codeMarche;
    private String receptionnaire;
    private Long commandeId;
    private String commandeReference;
    private String fournisseurNom;
    private String fournisseurIce;
    private String methode;
    private List<LigneReceptionResponse> lignes;
    private String notes;
    private BigDecimal totalHT;
    private BigDecimal totalTTC;
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;
    private String reliquatLie;
    private String reliquatSource;
    private List<DocumentJointReceptionResponse> documentsJoints;
    private BonEntreeSignaturesResponse bonEntreeSignatures;
    private boolean bonEntreeGenere;
    private boolean confirme;
    private LocalDateTime confirmeAt;
    private String confirmeBy;
}