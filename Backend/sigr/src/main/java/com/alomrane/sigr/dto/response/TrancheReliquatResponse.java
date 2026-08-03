// src/main/java/com/alomrane/sigr/dto/response/TrancheReliquatResponse.java
package com.alomrane.sigr.dto.response;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrancheReliquatResponse {
    private Long receptionId;
    private String receptionNumero;
    private String date;
    private List<LigneTrancheReliquatResponse> lignes;
}