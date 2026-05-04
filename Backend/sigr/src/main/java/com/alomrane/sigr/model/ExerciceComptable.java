package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.StatutExercice;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "exercices_comptables")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciceComptable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer annee;

    private LocalDate dateDebut;

    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    private StatutExercice statut;
}