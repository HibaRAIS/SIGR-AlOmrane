// RetourMateriel.java
package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "retours_materiel")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetourMateriel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime dateRetour;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pret_id")
    private PretMateriel pret;

    @OneToMany(mappedBy = "retour", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<LigneRetour> lignes = new ArrayList<>();
}