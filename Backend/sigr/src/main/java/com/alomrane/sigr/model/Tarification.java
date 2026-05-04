package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "tarifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tarification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal prixAchatHT;
    private BigDecimal prixVenteHT;
    private LocalDate dateDebutValidite;
    private LocalDate dateFinValidite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id")
    private Produit produit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tva_id")
    private Tva tva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "devise_id")
    private Devise devise;

    public boolean estActif() {
        LocalDate now = LocalDate.now();
        return now.isAfter(dateDebutValidite.minusDays(1))
                && (dateFinValidite == null || now.isBefore(dateFinValidite.plusDays(1)));
    }
}