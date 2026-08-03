package com.alomrane.sigr.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProduitDetailResponse {
    private Long id;
    private String code;
    private String name;
    private String category;
    private String subcategory;
    private String location;
    private int quantiteTheorique;
    private int quantiteReservee;
    private int currentStock;
    private int minThreshold;
    private BigDecimal avgPrice;
    private String imageUrl;
    private String description;
    private String weight;
    private String dimensions;
    private String material;
    private String safetyInstructions;
    private boolean consignable;
    private String lastUpdated;
    private String supplier;
    private int warrantyMonths;
    private String createdAt;
    private String dateDerniereEntree;  // format ISO
    private String dateDerniereSortie;

    // Cumuls
    private int cumulEntree;
    private int cumulSortie;
    private BigDecimal cumulValEntree;
    private BigDecimal cumulValSortie;
}