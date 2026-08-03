package com.alomrane.sigr.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StructureFlatDto {
    private Long id;
    private String nom;
    private String codeAnalytique;
    private String type; // Enum name (DIRECTION, DEPARTEMENT, ...)
    private String site;
    private Long parentId; // nullable, extrait du parent
}