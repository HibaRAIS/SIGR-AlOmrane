// dto/request/CreerTicketRequest.java
package com.alomrane.sigr.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreerTicketRequest {
    @NotBlank private String categorie;
    @NotBlank private String sujet;
    @NotBlank private String description;
    private String priorite; // BASSE, NORMALE, HAUTE, CRITIQUE
}