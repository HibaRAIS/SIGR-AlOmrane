// LigneMouvement.java
package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "lignes_mouvement")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneMouvement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal quantite;
    private BigDecimal stockApres;
    private BigDecimal pmpSnapshot;
    private BigDecimal valeurFlux;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_id")
    private JournalMouvement journalMouvement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id")
    private Produit produit;
}