// Tva.java
package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "tvas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;
    private String libelle;
    private BigDecimal taux;
    private LocalDate dateDebutValidite;
    private LocalDate dateFinValidite;

    public boolean estActif(LocalDate dateReference) {
        return dateReference.isAfter(dateDebutValidite.minusDays(1))
                && (dateFinValidite == null || dateReference.isBefore(dateFinValidite.plusDays(1)));
    }
}