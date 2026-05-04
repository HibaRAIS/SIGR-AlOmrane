// LigneInventaire.java
package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "lignes_inventaire")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneInventaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal quantiteTheorique;
    private BigDecimal quantiteReelle;
    private String motifAjustement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private SessionInventaire session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id")
    private Produit produit;

    @Transient
    public BigDecimal getEcart() {
        return quantiteTheorique.subtract(quantiteReelle);
    }
}