package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.TypeStructure;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "structures")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Structure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(unique = true)
    private String codeAnalytique;

    private String nom;

    @Enumerated(EnumType.STRING)
    private TypeStructure type;

    private String site;

    // Hiérarchie
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Structure parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnore
    @ToString.Exclude
    private List<Structure> enfants = new ArrayList<>();

    // Dérivé
    @Transient
    public String getCheminHierarchique() {
        // logique à implémenter si nécessaire
        return "";
    }
}