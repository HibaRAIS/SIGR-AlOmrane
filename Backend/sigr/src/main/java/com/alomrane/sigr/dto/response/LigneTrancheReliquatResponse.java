package com.alomrane.sigr.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LigneTrancheReliquatResponse {
    private Long produitId;
    private int quantiteRecue;
}