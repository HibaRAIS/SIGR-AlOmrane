// PretMateriel.java
package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.StatutPret;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "prets_materiel")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PretMateriel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime datePret;
    private LocalDateTime dateRetourPrevue;
    private LocalDateTime dateRetourEffective;

    @Enumerated(EnumType.STRING)
    private StatutPret statut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @OneToMany(mappedBy = "pret", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<LignePret> lignes = new ArrayList<>();

    @OneToMany(mappedBy = "pret", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<RetourMateriel> retours = new ArrayList<>();
}