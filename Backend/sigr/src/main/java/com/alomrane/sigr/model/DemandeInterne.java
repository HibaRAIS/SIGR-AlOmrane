package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.PrioriteDemande;
import com.alomrane.sigr.model.enums.StatutDemande;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "demandes_internes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeInterne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String numeroDemande;

    private LocalDateTime dateDemande;

    @Enumerated(EnumType.STRING)
    private PrioriteDemande priorite;

    @Enumerated(EnumType.STRING)
    private StatutDemande statut;

    private String motif;
    private String motifRejet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id")
    private Employe employe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "valideur_id")
    private Employe valideur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "valide_par")
    private Utilisateur validePar;

    private LocalDateTime dateValidation;   // ← AJOUT

    private String annotation;

    @OneToMany(mappedBy = "demande", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<LigneDemande> lignes = new ArrayList<>();

    // Méthodes métier
    public void creer() {
        this.statut = StatutDemande.EN_VALIDATION;
    }

    public void valider() {
        this.statut = StatutDemande.VALIDEE;
    }

    public void refuser(String motif) {
        this.statut = StatutDemande.REFUSEE;
        this.motifRejet = motif;
    }

    public void lancerPreparation() {
        this.statut = StatutDemande.EN_PREPARATION;
    }

    public void marquerLivree() {
        this.statut = StatutDemande.LIVREE;
    }
}