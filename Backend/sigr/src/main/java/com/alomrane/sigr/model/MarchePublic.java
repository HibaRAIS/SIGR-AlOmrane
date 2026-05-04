// MarchePublic.java
package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "marches_publics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarchePublic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String numeroMarche;

    private String objet;
    private BigDecimal budgetEngage;
}