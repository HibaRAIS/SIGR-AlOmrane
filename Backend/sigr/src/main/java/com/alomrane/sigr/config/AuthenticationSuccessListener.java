package com.alomrane.sigr.config;

import com.alomrane.sigr.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationListener;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AuthenticationSuccessListener implements ApplicationListener<AuthenticationSuccessEvent> {

    private final UtilisateurRepository utilisateurRepository;

    @Override
    public void onApplicationEvent(AuthenticationSuccessEvent event) {
        String login = event.getAuthentication().getName();
        utilisateurRepository.findByLoginLdap(login).ifPresent(user -> {
            user.setDerniereConnexion(LocalDateTime.now());
            utilisateurRepository.save(user);
        });
    }
}