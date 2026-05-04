// dto/response/TicketResponse.java
package com.alomrane.sigr.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TicketResponse {
    private Long id;
    private String sujet;
    private String description;
    private String priorite;
    private String statut;
    private String categorie;
    private LocalDateTime dateCreation;
    private String reponse;
    private LocalDateTime dateReponse;
    private String utilisateurNom;   // pour l'admin
    private String utilisateurEmail;
    private String utilisateurTelephone;
}