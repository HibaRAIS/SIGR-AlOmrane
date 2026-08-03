package com.alomrane.sigr.dto.response;

import lombok.Builder;

@Builder
public record UtilisateurDto(
        Long id,
        String loginLdap,
        boolean actif,
        String role,
        Long employeId,
        String employeNom,
        String department,
        String derniereConnexion,
        String createdAt,
        String phone
) {}