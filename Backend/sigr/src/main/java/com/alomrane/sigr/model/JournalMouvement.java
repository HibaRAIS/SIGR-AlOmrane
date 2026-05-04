// JournalMouvement.java
package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.TypeMouvement;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "journal_mouvements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalMouvement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime dateMouvement;

    @Enumerated(EnumType.STRING)
    private TypeMouvement type;

    private String referenceDocument;

    @Column(unique = true, updatable = false)
    private String hashChaine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercice_id")
    private ExerciceComptable exercice;

    @OneToMany(mappedBy = "journalMouvement", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<LigneMouvement> lignes = new ArrayList<>();
}