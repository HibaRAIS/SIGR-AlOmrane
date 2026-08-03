// dto/response/EmployeDto.java
package com.alomrane.sigr.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeDto {
    private Long id;
    private String matricule;
    private String badge;
    private String nom;
    private String prenom;
    private String emailProfessionnel;
    private String telephone;
    private String grade;               // nom de l'enum Grade
    private String structureNom;        // pour affichage département/direction
    private String structureCode;       // code analytique
    private Long structureId;
    private String managerNom;          // prénom + nom du manager
    private Long managerId;
    private String dateEmbauche;        // format JJ/MM/AAAA
    private boolean actif;              // statut actif/inactif
}