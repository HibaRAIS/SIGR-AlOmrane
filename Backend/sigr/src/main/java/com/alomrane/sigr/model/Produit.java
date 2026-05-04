package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "produits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String codeArticle;
    private String designation;
    private String description;
    private String uniteMesure;
    private String rayonEmplacement;
    private String nomenclatureDouane;
    private Boolean estConsignable;
    private Boolean estTaxable;
    private BigDecimal quantiteMin;
    private BigDecimal quantiteMax;
    private BigDecimal quantiteACommander;
    private String imageUrl;

    @OneToOne(mappedBy = "produit", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @JsonIgnore
    private StockPhysique stockPhysique;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categorie_id")
    private Categorie categorie;

    @OneToMany(mappedBy = "produit", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<Tarification> tarifications = new ArrayList<>();

    @OneToOne(mappedBy = "produit", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    private FicheTechnique ficheTechnique;

    @PrePersist
    public void prePersist() {
        if (this.stockPhysique == null) {
            this.stockPhysique = StockPhysique.builder()
                    .produit(this)
                    .quantiteTheorique(BigDecimal.ZERO)
                    .quantiteReservee(BigDecimal.ZERO)
                    .pmpActuel(BigDecimal.ZERO)
                    .cumulEntree(BigDecimal.ZERO)
                    .cumulSortie(BigDecimal.ZERO)
                    .build();
        }
    }

    // ==================== Égalité / Hachage ====================
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Produit produit = (Produit) o;
        return id != null && id.equals(produit.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}