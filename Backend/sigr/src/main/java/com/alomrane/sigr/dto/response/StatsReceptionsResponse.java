package com.alomrane.sigr.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsReceptionsResponse {
    private long total;
    private long CONFORME;
    private long PARTIELLE;
    private long COMPLEMENTAIRE;
    private BigDecimal totalTTC;
    private BigDecimal montantConforme;
    private BigDecimal montantPartielle;
    private long reliquatsOuverts;
}