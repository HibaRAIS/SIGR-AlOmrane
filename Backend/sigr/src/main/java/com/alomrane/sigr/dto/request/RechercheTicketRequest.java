package com.alomrane.sigr.dto.request;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RechercheTicketRequest {
    private String statut;
    private String priorite;
    private String categorie;
    private String search;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private Integer page;
    private Integer size;
}