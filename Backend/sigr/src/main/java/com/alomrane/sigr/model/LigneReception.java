package com.alomrane.sigr.model;

import lombok.*;
import jakarta.persistence.*;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reception_id", nullable = false)
    private Reception reception;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id")
    private Produit produit;

    @Column(name = "code_article", length = 50)
    private String codeArticle;

    @Column(nullable = false)
    private String designation;

    @Column(name = "quantite_commandee", nullable = false)
    private Integer quantiteCommandee;

    @Column(name = "quantite_recue", nullable = false)
    private Integer quantiteRecue;

    @Column(name = "prix_unitaire_ht", precision = 12, scale = 2)
    private BigDecimal prixUnitaireHT;

    @Column(precision = 5, scale = 2)
    private BigDecimal tva;

    @Column(name = "total_ht", precision = 12, scale = 2)
    private BigDecimal totalHT;

    @Column(name = "total_ttc", precision = 12, scale = 2)
    private BigDecimal totalTTC;

    @Column(name = "pmp_avant", precision = 12, scale = 2)
    private BigDecimal pmpAvant;

    @Column(name = "pmp_apres", precision = 12, scale = 2)
    private BigDecimal pmpApres;

    @Column(name = "stock_avant", precision = 12, scale = 2)
    private BigDecimal stockAvant;

    @Column(name = "stock_apres", precision = 12, scale = 2)
    private BigDecimal stockApres;

    public void calculerTotaux() {
        BigDecimal qte = BigDecimal.valueOf(quantiteRecue);
        this.totalHT = prixUnitaireHT.multiply(qte);
        BigDecimal taux = tva.divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP);
        this.totalTTC = totalHT.multiply(BigDecimal.ONE.add(taux));
    }

    @PrePersist
    @PreUpdate
    private void beforeSave() {
        calculerTotaux();
    }
}