package com.alomrane.sigr.model;

import lombok.*;
import jakarta.persistence.*;

@Entity
@Table(name = "bon_entree_signatures")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonEntreeSignatures {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reception_id", unique = true, nullable = false)
    private Reception reception;

    @Lob
    @Column(name = "resp_magasin_img")
    private String responsableMagasinImg;

    @Column(name = "resp_magasin_date", length = 30)
    private String responsableMagasinDate;

    @Lob
    @Column(name = "chef_logistique_img")
    private String chefLogistiqueImg;

    @Column(name = "chef_logistique_date", length = 30)
    private String chefLogistiqueDate;
}