// src/main/java/com/alomrane/sigr/model/DocumentJointReception.java
package com.alomrane.sigr.model;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents_reception")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentJointReception {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reception_id", nullable = false)
    private Reception reception;

    @Column(nullable = false, length = 255)
    private String nom;

    @Column(name = "data_url", nullable = false, columnDefinition = "LONGTEXT")
    private String dataUrl;       // stocke le contenu Base64

    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "date_ajout")
    private LocalDateTime dateAjout;

    @PrePersist
    protected void onCreate() {
        dateAjout = LocalDateTime.now();
    }
}