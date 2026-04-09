package com.alomrane.sigr.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "produits")
@Data @NoArgsConstructor @AllArgsConstructor
public class Produit {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String designation;

    @Column(nullable = false, unique = true)
    private String reference;

    private String description;
    private String categorie;

    @Column(nullable = false)
    private Integer stockDisponible = 0;
}