// LigneCommande.java
package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "lignes_commande")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneCommande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal quantiteCommandee;
    private BigDecimal prixAchatNegocieHT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bon_commande_id")
    private BonCommande bonCommande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id")
    private Produit produit;

    @Transient
    public BigDecimal getReliquat() {
        // à calculer en fonction des réceptions (à implémenter)
        return BigDecimal.ZERO;
    }
}