package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.Employe;
import com.alomrane.sigr.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByLoginLdap(String loginLdap);
    Optional<Utilisateur> findByEmploye(Employe employe);
}