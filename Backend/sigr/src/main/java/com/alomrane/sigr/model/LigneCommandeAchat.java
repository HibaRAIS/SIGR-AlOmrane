package com.alomrane.sigr.model;

import jakarta.persistence.Table;
import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "lignes_commande_achat")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LigneCommandeAchat {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id", nullable = false)
    private CommandeAchat commande;

    private String codeArticle;

    @Column(nullable = false)
    private String designation;

    @Column(nullable = false)
    private Integer quantite;

    @Column(nullable = false)
    private BigDecimal prixUnitaireHT;

    @Column(nullable = false)
    private BigDecimal tauxTVA;   // en pourcentage
}