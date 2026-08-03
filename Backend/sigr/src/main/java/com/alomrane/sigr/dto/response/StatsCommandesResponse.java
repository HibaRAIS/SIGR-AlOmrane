package com.alomrane.sigr.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class StatsCommandesResponse {
    private long total;
    private long enCours;
    private long recues;
    private long annulees;
    private long nbMarchePublic;
    private long nbBonCommande;
    private BigDecimal montantEnCours;
    private BigDecimal montantRecues;
}