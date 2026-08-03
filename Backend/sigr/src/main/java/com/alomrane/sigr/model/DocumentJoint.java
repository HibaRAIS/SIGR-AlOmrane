package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.TypeDocument;
import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents_commandes")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentJoint {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id", nullable = false)
    private CommandeAchat commande;

    private String nom;

    @Enumerated(EnumType.STRING)
    private TypeDocument type;

    @Lob
    private String dataUrl;   // ou chemin vers fichier

    private LocalDateTime dateAjout;
}