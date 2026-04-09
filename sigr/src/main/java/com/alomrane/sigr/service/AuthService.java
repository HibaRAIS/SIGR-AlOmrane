package com.alomrane.sigr.service;

import com.alomrane.sigr.config.JwtUtil;
import com.alomrane.sigr.dto.LoginRequest;
import com.alomrane.sigr.dto.LoginResponse;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.query.LdapQueryBuilder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UtilisateurRepository utilisateurRepo;
    private final JwtUtil jwtUtil;
    private final LdapTemplate ldapTemplate;

    public LoginResponse login(LoginRequest request) {
        // 1. Authentifier via LDAP
        String uid = request.email().split("@")[0];
        try {
            ldapTemplate.authenticate(
                    LdapQueryBuilder.query()
                            .base("ou=users,dc=alomrane,dc=ma")
                            .where("uid").is(uid),
                    request.password()
            );
        } catch (Exception e) {
            System.out.println("LDAP ERROR: " + e.getMessage());
            throw new RuntimeException("Identifiants invalides");
        }

        // 2. Récupérer l'utilisateur en base
        Utilisateur user = utilisateurRepo.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable en base"));

        // 3. Générer le JWT
        String token = jwtUtil.generateToken(user);
        String nom = user.getEmploye().getPrenom() + " " + user.getEmploye().getNom();

        return new LoginResponse(token, user.getRole().name(), nom);
    }
}