// src/main/java/com/alomrane/sigr/dto/response/ReliquatResponse.java
package com.alomrane.sigr.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReliquatResponse {
    private String id;
    private Long commandeId;
    private String commandeReference;
    private String fournisseurNom;
    private List<LigneReliquatResponse> lignes;
    private LocalDateTime dateCreation;
    private Long receptionSourceId;
    private String receptionSourceNumero;
    private String statut;
    private List<TrancheReliquatResponse> tranches;
}