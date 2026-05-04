package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "stocks_physiques")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockPhysique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal quantiteTheorique;
    private BigDecimal quantiteReservee;
    private String emplacementPrincipal;
    private BigDecimal cumulEntree;
    private BigDecimal cumulSortie;
    private LocalDate dateDerniereSortie;
    private BigDecimal pmpActuel;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id", unique = true)
    @ToString.Exclude
    private Produit produit;

    @Transient
    public BigDecimal getQuantiteDisponible() {
        return quantiteTheorique.subtract(quantiteReservee);
    }

    // Méthodes métier (à ajouter si nécessaire)
    public void mettreAJour(BigDecimal entree, BigDecimal sortie) {
        if (entree != null && entree.compareTo(BigDecimal.ZERO) > 0) {
            this.quantiteTheorique = this.quantiteTheorique.add(entree);
            this.cumulEntree = this.cumulEntree.add(entree);
        }
        if (sortie != null && sortie.compareTo(BigDecimal.ZERO) > 0) {
            this.quantiteTheorique = this.quantiteTheorique.subtract(sortie);
            this.cumulSortie = this.cumulSortie.add(sortie);
            this.dateDerniereSortie = LocalDate.now();
        }
    }

    public void recalculerPMP(BigDecimal qte, BigDecimal prix) {
        if (qte == null || prix == null) return;
        BigDecimal ancienneValeur = this.quantiteTheorique.subtract(qte).multiply(this.pmpActuel);
        BigDecimal nouvelleValeur = qte.multiply(prix);
        BigDecimal nouvelleQuantite = this.quantiteTheorique;
        if (nouvelleQuantite.compareTo(BigDecimal.ZERO) > 0) {
            this.pmpActuel = ancienneValeur.add(nouvelleValeur).divide(nouvelleQuantite, 2, java.math.RoundingMode.HALF_UP);
        } else {
            this.pmpActuel = BigDecimal.ZERO;
        }
    }
}