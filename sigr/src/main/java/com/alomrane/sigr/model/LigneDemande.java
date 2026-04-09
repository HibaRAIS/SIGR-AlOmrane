package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "lignes_demande")
@Data @NoArgsConstructor @AllArgsConstructor
public class LigneDemande {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "demande_id", nullable = false)
    private DemandeInterne demande;

    @ManyToOne
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @Column(nullable = false)
    private Integer quantite;
}