package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.AlerteType;
import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alertes_stock")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlerteStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlerteType type;

    @Column(nullable = false)
    private String message;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(nullable = false)
    private boolean traitee;

    @Column(nullable = false)
    private boolean ignoree;
}