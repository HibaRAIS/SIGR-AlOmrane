package com.alomrane.sigr.dto.response;

import java.time.LocalDateTime;

public record BonSortieResponse(
        Long id,
        LocalDateTime dateSortie,
        String statut,
        String nomReceptionnaire,
        Long demandeId,
        String demandeReference
) {}