// LigneDemande.java
package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "lignes_demande")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneDemande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal quantiteDemandee;
    private BigDecimal quantiteAccordee; // dérivé

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id")
    private DemandeInterne demande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id")
    private Produit produit;

    public boolean verifierDisponibilite() {
        return produit.getStockPhysique().getQuantiteDisponible().compareTo(quantiteDemandee) >= 0;
    }
}