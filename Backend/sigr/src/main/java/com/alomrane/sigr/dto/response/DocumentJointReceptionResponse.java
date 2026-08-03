// src/main/java/com/alomrane/sigr/dto/response/DocumentJointReceptionResponse.java
package com.alomrane.sigr.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class DocumentJointReceptionResponse {
    private Long id;
    private String nom;
    private String type;
    private String url;
    private LocalDateTime dateAjout;
}