package com.alomrane.sigr.dto.request;

import java.util.List;

public record AjusterDemandeRequest(List<LigneAjustee> lignes) {
    public record LigneAjustee(Long ligneId, Integer quantiteAccordee) {}
}