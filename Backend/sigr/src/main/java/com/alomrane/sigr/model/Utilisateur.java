package com.alomrane.sigr.model;

import com.alomrane.sigr.model.enums.RoleUtilisateur;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "utilisateurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "employe")
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String loginLdap;

    private boolean actif;

    private LocalDateTime derniereConnexion;

    @Enumerated(EnumType.STRING)
    private RoleUtilisateur role;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", unique = true)
    private Employe employe;
}