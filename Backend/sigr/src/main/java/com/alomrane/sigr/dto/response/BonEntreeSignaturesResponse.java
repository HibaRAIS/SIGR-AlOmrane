package com.alomrane.sigr.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BonEntreeSignaturesResponse {
    private String responsableMagasinImg;
    private String responsableMagasinDate;
    private String chefLogistiqueImg;
    private String chefLogistiqueDate;
}