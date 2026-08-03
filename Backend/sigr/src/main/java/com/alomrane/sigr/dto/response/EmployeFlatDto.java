// dto/response/EmployeFlatDto.java
package com.alomrane.sigr.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeFlatDto {
    private Long id;
    private String nom;
    private String prenom;
    private String emailProfessionnel;
    private String telephone;
    private String grade;      // nom de l’enum
    private Long structureId;  // id de la structure d’appartenance
}