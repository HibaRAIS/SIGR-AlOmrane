package com.alomrane.sigr.model;

import lombok.*;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tranches_reliquat")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrancheReliquat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reliquat_id", nullable = false)
    private Reliquat reliquat;

    @Column(name = "reception_id")
    private Long receptionId;

    @Column(name = "reception_numero", length = 20)
    private String receptionNumero;

    @Column(length = 20)
    private String date;

    @OneToMany(mappedBy = "tranche", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LigneTrancheReliquat> lignes = new ArrayList<>();
}