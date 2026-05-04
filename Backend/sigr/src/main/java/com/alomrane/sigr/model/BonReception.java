// BonReception.java
package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.StatutReception;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bons_reception")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonReception {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String numeroInterne;

    private String numeroBLFournisseur;
    private LocalDateTime dateReception;

    @Enumerated(EnumType.STRING)
    private StatutReception statut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bon_commande_id")
    private BonCommande bonCommande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @OneToMany(mappedBy = "bonReception", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<LigneReception> lignes = new ArrayList<>();
}