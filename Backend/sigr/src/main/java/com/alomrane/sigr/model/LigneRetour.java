// LigneRetour.java
package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "lignes_retour")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneRetour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal quantiteRetournee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retour_id")
    private RetourMateriel retour;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ligne_pret_id")
    private LignePret lignePret;
}