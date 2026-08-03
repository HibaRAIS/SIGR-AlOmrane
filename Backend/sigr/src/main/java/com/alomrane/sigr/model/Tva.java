// Tva.java (modifié)
package com.alomrane.sigr.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    @NotBlank
    private String code;

    @NotBlank
    private String libelle;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal taux;

    @NotNull
    private LocalDate dateDebutValidite;

    private LocalDate dateFinValidite;   // peut être null

    @Builder.Default
    @Column(nullable = false)
    private Boolean actif = true;

    public boolean estActif(LocalDate dateReference) {
        return dateReference.isAfter(dateDebutValidite.minusDays(1))
                && (dateFinValidite == null || dateReference.isBefore(dateFinValidite.plusDays(1)));
    }
}