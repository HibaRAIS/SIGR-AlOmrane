package com.alomrane.sigr.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity @Table(name = "structures")
@Data @NoArgsConstructor @AllArgsConstructor
@ToString(exclude = "enfants")  // ← ajoute ça
public class Structure {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Structure parent;

    @OneToMany(mappedBy = "parent")
    @JsonIgnore              // ← garde seulement cette version
    private List<Structure> enfants;  // ← une seule fois
}