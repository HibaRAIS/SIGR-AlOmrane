package com.alomrane.sigr.dto.request;

import java.util.List;

public record PreparationRequest(
        List<LignePreparationRequest> lignes,
        String observationsGlobales
) {}