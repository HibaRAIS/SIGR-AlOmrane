package com.alomrane.sigr.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TvaResponse(
        Long id,
        String code,
        String libelle,
        BigDecimal taux,
        LocalDate dateDebutValidite,
        LocalDate dateFinValidite,
        Boolean actif
) {}