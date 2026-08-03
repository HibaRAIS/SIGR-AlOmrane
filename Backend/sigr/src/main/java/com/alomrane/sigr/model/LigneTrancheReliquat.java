package com.alomrane.sigr.model;

import lombok.*;
import jakarta.persistence.*;

@Entity
@Table(name = "lignes_tranche_reliquat")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneTrancheReliquat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tranche_id")
    private TrancheReliquat tranche;

    @Column(name = "produit_id")
    private Long produitId;

    @Column(name = "quantite_recue")
    private Integer quantiteRecue;
}