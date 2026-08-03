package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.MethodeCommande;
import com.alomrane.sigr.model.enums.StatutCommande;
import jakarta.persistence.CascadeType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "commandes_achat")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CommandeAchat {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String reference;

    private String description;
    private String objetMarche;

    @Column(nullable = false)
    private String fournisseur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MethodeCommande methode;

    private String numeroMarche;
    private BigDecimal montantMarche;
    private LocalDate dateCommande;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutCommande statut;

    @Column(length = 1000)
    private String motifAnnulation;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LigneCommandeAchat> lignes = new ArrayList<>();

    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DocumentJoint> documents = new ArrayList<>();

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}