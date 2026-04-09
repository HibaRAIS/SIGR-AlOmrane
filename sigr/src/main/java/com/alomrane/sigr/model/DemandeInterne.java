package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity @Table(name = "demandes_internes")
@Data @NoArgsConstructor @AllArgsConstructor
public class DemandeInterne {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String reference;

    @ManyToOne
    @JoinColumn(name = "employe_id", nullable = false)
    private Employe employe;

    @ManyToOne
    @JoinColumn(name = "structure_id", nullable = false)
    private Structure structure;

    @Enumerated(EnumType.STRING)
    private Statut statut = Statut.EN_ATTENTE;

    @Enumerated(EnumType.STRING)
    private Urgence urgence = Urgence.NORMAL;

    @Column(nullable = false)
    private String justification;

    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "valide_par")
    private Utilisateur validePar;

    private LocalDateTime dateValidation;
    private String motifRefus;

    @ManyToOne
    @JoinColumn(name = "valideur_id")
    private Employe valideur;

    @OneToMany(mappedBy = "demande", cascade = CascadeType.ALL)
    private List<LigneDemande> lignes;

    public enum Statut {
        EN_ATTENTE, APPROUVEE, REFUSEE, EN_TRAITEMENT, LIVREE
    }

    public enum Urgence {
        NORMAL, URGENT, CRITIQUE
    }
}