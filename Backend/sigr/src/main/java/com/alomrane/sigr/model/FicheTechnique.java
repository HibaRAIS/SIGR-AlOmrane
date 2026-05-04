package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "fiches_techniques")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FicheTechnique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal poidsUnitaire;
    private String dimensions;
    private String materiau;

    @Column(columnDefinition = "TEXT")
    private String instructionsSecurite;

    // Relation un-à-un avec Produit (côté propriétaire = FicheTechnique)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id", unique = true)
    @ToString.Exclude
    private Produit produit;
}