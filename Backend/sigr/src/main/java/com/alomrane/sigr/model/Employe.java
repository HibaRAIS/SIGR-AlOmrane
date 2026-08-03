package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.Grade;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "employes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String matricule;

    @Column(unique = true)
    private String badge;

    private String nom;
    private String prenom;

    @Column(unique = true)
    private String emailProfessionnel;

    private String telephone;

    @Enumerated(EnumType.STRING)
    private Grade grade;

    private LocalDate dateEmbauche;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "structure_id")
    private Structure structure;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employe manager;

    @OneToMany(mappedBy = "manager", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<Employe> subordonnes = new ArrayList<>();

    // =================================================================
    // SETTERS PERSONNALISÉS POUR LA SÉCURITÉ DE LA BASE DE DONNÉES
    // =================================================================

    public void setBadge(String badge) {
        if (badge != null && badge.trim().isEmpty()) {
            this.badge = null;
        } else {
            this.badge = badge;
        }
    }

    public void setTelephone(String telephone) {
        if (telephone != null && telephone.trim().isEmpty()) {
            this.telephone = null;
        } else {
            this.telephone = telephone;
        }
    }
}