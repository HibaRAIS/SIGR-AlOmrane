// Fournisseur.java
package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "fournisseurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fournisseur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String raisonSociale;
    private String ice;
    private String identifiantFiscal;
    private String registreCommerce;
    private String telephone;
    private String email;
}