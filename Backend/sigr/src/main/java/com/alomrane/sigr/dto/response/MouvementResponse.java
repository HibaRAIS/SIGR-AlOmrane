package com.alomrane.sigr.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MouvementResponse {
    private Long id;
    private String date;
    private String type;           // ENTREE, SORTIE, AJUSTEMENT
    private String hashChaine;
    private String referenceDocument;
    private String designation;    // produit
    private String codeArticle;
    private String uniteMesure;
    private int quantiteMin;
    private String departement;    // nom de la structure (département)
    private int quantite;
    private int stockInitial;
    private int stockAvant;
    private int stockApres;
    private BigDecimal pmpSnapshot;
    private BigDecimal valeurFlux;
    private String utilisateur;
    private String motif;          // nullable, pour ajustements
    private String codeUnique;
}