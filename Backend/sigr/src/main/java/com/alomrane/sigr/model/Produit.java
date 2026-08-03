package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    @Column(unique = true, nullable = false)
    private String codeArticle;
    private String designation;
    private String description;
    private String uniteMesure;
    private String rayonEmplacement;
    private Boolean estConsignable;
    private BigDecimal quantiteMin;
    private String imageUrl;
    // Nouveau champ pour le nom du fournisseur
    private String fournisseurNom;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "produit", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @JsonIgnore
    private StockPhysique stockPhysique;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categorie_id")
    private Categorie categorie;


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