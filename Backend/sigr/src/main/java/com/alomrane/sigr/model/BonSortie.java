// BonSortie.java
package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.StatutSortie;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bons_sortie")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonSortie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime dateSortie;
    private String nomReceptionnaire;

    @Enumerated(EnumType.STRING)
    private StatutSortie statut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id")
    private DemandeInterne demande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @Lob
    private String observations;

    @Lob
    private String signaturesJson;

    @OneToMany(mappedBy = "bonSortie", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<LigneSortie> lignes = new ArrayList<>();
}