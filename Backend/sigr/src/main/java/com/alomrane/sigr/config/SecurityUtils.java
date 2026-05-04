package com.alomrane.sigr.config;

import com.alomrane.sigr.model.Utilisateur;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    public Utilisateur getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Utilisateur) {
            return (Utilisateur) auth.getPrincipal();
        }
        throw new RuntimeException("Utilisateur non authentifié");
    }
}
