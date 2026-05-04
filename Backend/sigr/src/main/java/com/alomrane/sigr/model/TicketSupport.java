// model/TicketSupport.java
package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.PrioriteTicket;
import com.alomrane.sigr.model.enums.StatutTicket;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets_support")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketSupport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sujet;

    @Column(length = 2000, nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    private PrioriteTicket priorite;

    @Enumerated(EnumType.STRING)
    private StatutTicket statut;

    private String categorie;   // password, access, hardware, software, other

    private LocalDateTime dateCreation;

    private LocalDateTime dateReponse;

    @Column(length = 2000)
    private String reponse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        if (statut == null) statut = StatutTicket.EN_ATTENTE;
        if (priorite == null) priorite = PrioriteTicket.NORMALE;
    }
}