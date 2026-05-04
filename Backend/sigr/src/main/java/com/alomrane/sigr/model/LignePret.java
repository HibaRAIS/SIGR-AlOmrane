// LignePret.java
package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "lignes_pret")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LignePret {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal quantitePretee;
    private BigDecimal quantiteRetournee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pret_id")
    private PretMateriel pret;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id")
    private Produit produit;

    @Transient
    public BigDecimal getReste() {
        return quantitePretee.subtract(quantiteRetournee);
    }
}