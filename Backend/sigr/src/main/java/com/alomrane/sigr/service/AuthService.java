package com.alomrane.sigr.service;

import com.alomrane.sigr.config.JwtUtil;
import com.alomrane.sigr.dto.request.LoginRequest;
import com.alomrane.sigr.dto.response.LoginResponse;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.query.LdapQueryBuilder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UtilisateurRepository utilisateurRepo;
    private final JwtUtil jwtUtil;
    private final LdapTemplate ldapTemplate;

    public LoginResponse login(LoginRequest request) {
        String login = request.email();
        String uid = login.contains("@") ? login.split("@")[0] : login;

        try {
            ldapTemplate.authenticate(
                    LdapQueryBuilder.query()
                            .base("ou=users,dc=alomrane,dc=ma")
                            .where("uid").is(uid),
                    request.password()
            );
        } catch (Exception e) {
            throw new RuntimeException("Identifiants invalides");
        }

        Utilisateur user = utilisateurRepo.findByLoginLdap(uid)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable en base"));
        if (!user.isActif()) {
            throw new RuntimeException("Compte inactif");
        }
        user.setDerniereConnexion(LocalDateTime.now());
        utilisateurRepo.save(user);

        String token = jwtUtil.generateToken(user);
        String nom = user.getEmploye().getPrenom() + " " + user.getEmploye().getNom();
        String loginLdap = user.getLoginLdap();
        return new LoginResponse(token, user.getRole().name(), nom, loginLdap);
    }
}