// Fournisseur.java
package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

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

    @Column(unique = true, nullable = false, length = 20)
    private String code;                // ex: FRN-1001

    @Column(nullable = false)
    private String raisonSociale;

    @Column(unique = true, nullable = false, length = 15)
    private String ice;

    private String identifiantFiscal;

    private String registreCommerce;

    private String telephone;

    private String email;

    private String adresse;

    private String ville;

    private String pays;

    @Builder.Default
    private Boolean actif = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}