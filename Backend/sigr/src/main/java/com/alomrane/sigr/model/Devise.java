// Devise.java
package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "devises")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Devise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String codeIso;

    private String libelle;
    private BigDecimal tauxVersMad;
    private LocalDate dateActualisation;
}