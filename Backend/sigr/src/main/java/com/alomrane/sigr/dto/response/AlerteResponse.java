package com.alomrane.sigr.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlerteResponse {
    private Long id;
    private String type;          // CRITIQUE, FAIBLE, SURVEILLANCE
    private String message;
    private LocalDateTime dateCreation;
    private boolean traitee;
    private boolean ignoree;
    private Long produitId;
    private String produitCode;
    private String produitDesignation;
    private int stockDisponible;
    private String uniteMesure;
}