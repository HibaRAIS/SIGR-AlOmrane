// CreateFournisseurRequest.java
package com.alomrane.sigr.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateFournisseurRequest {

    @NotBlank(message = "La raison sociale est obligatoire")
    private String raisonSociale;

    @NotBlank(message = "L'ICE est obligatoire")
    @Pattern(regexp = "^\\d{15}$", message = "L'ICE doit comporter 15 chiffres")
    private String ice;

    private String identifiantFiscal;
    private String registreCommerce;

    // Suppression de @Pattern – validation déplacée dans le service
    private String telephone;
    private String email;

    private String adresse;
    private String ville;
    private String pays;
    private Boolean actif;
}