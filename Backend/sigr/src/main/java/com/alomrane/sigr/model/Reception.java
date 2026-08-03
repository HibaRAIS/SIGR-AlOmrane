package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.StatutReception;
import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "receptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reception {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String numero;

    @Column(nullable = false)
    private int tranche;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutReception statut;

    @Column(name = "date_reception", nullable = false)
    private LocalDate dateReception;

    @Column(name = "bon_livraison", nullable = false, length = 100)
    private String bonLivraison;

    @Column(name = "numero_facture", length = 50)
    private String numeroFacture;

    @Column(name = "code_marche", length = 50)
    private String codeMarche;

    @Column(length = 100)
    private String receptionnaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id", nullable = false)
    private CommandeAchat commande;

    @OneToMany(mappedBy = "reception", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LigneReception> lignes = new ArrayList<>();

    @Column(length = 2000)
    private String notes;

    @Column(name = "total_ht", precision = 12, scale = 2)
    private BigDecimal totalHT;

    @Column(name = "total_ttc", precision = 12, scale = 2)
    private BigDecimal totalTTC;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "reliquat_lie", length = 30)
    private String reliquatLie;

    @Column(name = "reliquat_source", length = 30)
    private String reliquatSource;

    @OneToMany(mappedBy = "reception", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DocumentJointReception> documentsJoints = new ArrayList<>();

    @Column(name = "bon_entree_genere")
    private boolean bonEntreeGenere;


    @OneToOne(mappedBy = "reception", cascade = CascadeType.ALL, orphanRemoval = true)
    private BonEntreeSignatures bonEntreeSignatures;

    @Column(nullable = false)
    private boolean confirme;

    @Column(name = "confirme_at")
    private LocalDateTime confirmeAt;

    @Column(name = "confirme_by", length = 100)
    private String confirmeBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (confirmeAt == null) confirmeAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public BigDecimal getTotalHT() {
        return lignes.stream()
                .map(LigneReception::getTotalHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getTotalTTC() {
        return lignes.stream()
                .map(LigneReception::getTotalTTC)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}