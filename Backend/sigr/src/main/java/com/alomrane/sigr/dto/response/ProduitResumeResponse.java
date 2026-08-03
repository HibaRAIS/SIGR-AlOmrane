package com.alomrane.sigr.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProduitResumeResponse {
    private Long id;
    private String code;
    private String name;
    private String category;
    private String location;
    private int quantiteTheorique;   // stock physique réel (quantité théorique)
    private int quantiteReservee;    // quantité réservée (demandes validées)
    private int currentStock;        // alias de quantiteTheorique (compatibilité)
    private int minThreshold;
    private BigDecimal avgPrice;     // PMP actuel
    private String imageUrl;
    private String supplier;
    private String status;          // sera "OK", "FAIBLE" ou "CRITIQUE" (en minuscules pour le frontend)
}