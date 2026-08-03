package com.alomrane.sigr.dto.request;

public record LignePreparationRequest(
        Long ligneSortieId,
        int quantiteServie,
        String observation
) {}