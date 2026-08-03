// UpdateFournisseurRequest.java
package com.alomrane.sigr.dto.request;

import lombok.Data;

@Data
public class UpdateFournisseurRequest {

    private String raisonSociale;          // optionnel
    private String ice;                   // optionnel, sera validé si fourni
    private String identifiantFiscal;
    private String registreCommerce;
    private String telephone;             // optionnel, validation dans le service
    private String email;                 // optionnel, validation dans le service
    private String adresse;
    private String ville;
    private String pays;
    private Boolean actif;
}