// BonCommande.java
package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.StatutCommande;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bons_commande")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonCommande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String numeroBC;

    private LocalDateTime dateEmission;

    @Enumerated(EnumType.STRING)
    private StatutCommande statut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fournisseur_id")
    private Fournisseur fournisseur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marche_id")
    private MarchePublic marche;

    @OneToMany(mappedBy = "bonCommande", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<LigneCommande> lignes = new ArrayList<>();

    public BigDecimal calculerMontantHT() {
        return lignes.stream()
                .map(LigneCommande::getPrixAchatNegocieHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}