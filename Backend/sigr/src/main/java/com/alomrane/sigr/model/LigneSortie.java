// LigneSortie.java
package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "lignes_sortie")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneSortie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal quantiteSortie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bon_sortie_id")
    private BonSortie bonSortie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id")
    private Produit produit;
}