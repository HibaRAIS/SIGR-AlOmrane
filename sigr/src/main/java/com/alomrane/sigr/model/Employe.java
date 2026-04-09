package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "employes")
@Data @NoArgsConstructor @AllArgsConstructor
public class Employe {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @ManyToOne
    @JoinColumn(name = "structure_id", nullable = false)
    private Structure structure;

    @ManyToOne
    @JoinColumn(name = "manager_id")
    private Employe manager;
}