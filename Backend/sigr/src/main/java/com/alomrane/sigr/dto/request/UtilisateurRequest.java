package com.alomrane.sigr.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UtilisateurRequest(
        @NotBlank(message = "Le login LDAP est obligatoire")
        String loginLdap,

        boolean actif,

        @NotBlank(message = "Le rôle est obligatoire")
        String role,

        @NotNull(message = "L'employé est obligatoire")
        Long employeId
) {}