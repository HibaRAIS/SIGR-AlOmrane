// SessionInventaire.java
package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.StatutInventaire;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sessions_inventaire")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionInventaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime dateInventaire;

    @Enumerated(EnumType.STRING)
    private StatutInventaire statut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<LigneInventaire> lignes = new ArrayList<>();
}