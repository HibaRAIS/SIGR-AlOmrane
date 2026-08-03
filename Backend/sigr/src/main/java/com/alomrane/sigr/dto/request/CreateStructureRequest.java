// dto/request/CreateStructureRequest.java
package com.alomrane.sigr.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateStructureRequest {

    @NotBlank
    @Size(min = 2)
    private String nom;

    @NotBlank
    @Size(min = 1)
    private String codeAnalytique;

    @NotBlank
    private String type; // DIRECTION, DEPARTEMENT, DIVISION, UGP, AGENCE

    private String site;

    private Long parentId; // null si racine
}