package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Entity
@Table(name = "stocks_physiques")
@Getter
@Setter
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
    private LocalDate dateDerniereEntree;
    private BigDecimal pmpActuel;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id", unique = true)
    @ToString.Exclude
    @JsonIgnore
    private Produit produit;

    @Transient
    public BigDecimal getQuantiteDisponible() {
        return quantiteTheorique.subtract(quantiteReservee);
    }

    // Méthodes métier inchangées
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
        if (qte == null || prix == null || pmpActuel == null) return;
        BigDecimal stockAvant = this.quantiteTheorique; // stock avant l’entrée
        BigDecimal valeurStockAvant = stockAvant.multiply(this.pmpActuel);
        BigDecimal valeurEntree = qte.multiply(prix);
        BigDecimal nouveauStock = stockAvant.add(qte);

        if (nouveauStock.compareTo(BigDecimal.ZERO) > 0) {
            this.pmpActuel = valeurStockAvant.add(valeurEntree)
                    .divide(nouveauStock, 6, RoundingMode.HALF_UP); // précision 6 pour éviter les pertes
        } else {
            this.pmpActuel = BigDecimal.ZERO;
        }
        // La quantité théorique est mise à jour par le service après cet appel
    }

    // ==================== Égalité / Hachage ====================
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        StockPhysique that = (StockPhysique) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}