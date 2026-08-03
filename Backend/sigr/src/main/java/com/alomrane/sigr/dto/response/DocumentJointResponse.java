package com.alomrane.sigr.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DocumentJointResponse {
    private Long id;
    private String nom;
    private String type;
    private String dataUrl;
    private LocalDateTime dateAjout;
}

