package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Enumerated(EnumType.STRING)
    private TypeNotification type; // SUCCESS, WARNING, INFO, ERROR

    private String titre;
    private String message;
    private String details; // optionnel (texte long)

    private String lien; // URL relative (ex: "/dashboard/suivi?id=123")

    private boolean lu;

    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }

    public enum TypeNotification {
        SUCCESS, WARNING, INFO, ERROR
    }
}