package com.alomrane.sigr.model;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "lignes_reliquat")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneReliquat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reliquat_id", nullable = false)
    private Reliquat reliquat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id")
    private Produit produit;

    @Column(nullable = false)
    private String designation;

    @Column(length = 50)
    private String reference;

    @Column(name = "quantite_initiale")
    private Integer quantiteInitiale;

    @Column(name = "quantite_restante")
    private Integer quantiteRestante;

    @Column(name = "prix_unitaire_ht", precision = 12, scale = 2)
    private BigDecimal prixUnitaireHT;

    @Column(precision = 5, scale = 2)
    private BigDecimal tva;
}