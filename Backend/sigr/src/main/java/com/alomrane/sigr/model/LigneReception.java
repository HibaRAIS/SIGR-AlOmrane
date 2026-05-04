// LigneReception.java
package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "lignes_reception")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneReception {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal quantiteRecue;
    private BigDecimal prixAchatEffectifHT;
    private BigDecimal fraisApproche;
    private BigDecimal tauxTvaApplique;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bon_reception_id")
    private BonReception bonReception;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ligne_commande_id")
    private LigneCommande ligneCommande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id")
    private Produit produit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tva_id")
    private Tva tva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "devise_id")
    private Devise devise;

    public BigDecimal calculerPrixRevient() {
        return prixAchatEffectifHT.add(fraisApproche);
    }
}