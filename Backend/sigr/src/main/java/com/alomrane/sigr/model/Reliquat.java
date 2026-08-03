package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.StatutReliquat;
import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reliquats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reliquat {

    @Id
    @Column(length = 30)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id", nullable = false)
    private CommandeAchat commande;

    @OneToMany(mappedBy = "reliquat", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LigneReliquat> lignes = new ArrayList<>();

    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    @Column(name = "reception_source_id")
    private Long receptionSourceId;

    @Column(name = "reception_source_numero", length = 20)
    private String receptionSourceNumero;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutReliquat statut;

    @OneToMany(mappedBy = "reliquat", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TrancheReliquat> tranches = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }
}