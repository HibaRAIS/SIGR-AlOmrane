// dto/response/ProfilResponse.java
package com.alomrane.sigr.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfilResponse {
    private String prenom;
    private String nom;
    private String email;
    private String telephone;
    private String service; // nom de la structure
    private String site;
    private String matricule;
    private String responsable;  // nom du manager
    private String niveauAcces;  // rôle utilisateur
    private String badge;
    private String derniereConnexion;
}