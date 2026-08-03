package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.Employe;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.model.enums.RoleUtilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByLoginLdap(String loginLdap);
    Optional<Utilisateur> findByEmploye(Employe employe);
    @Query("SELECT u FROM Utilisateur u WHERE u.employe IN :employes")
    List<Utilisateur> findByEmployeIn(@Param("employes") List<Employe> employes);
    // Utiliser l'enum, pas une String
    List<Utilisateur> findByRole(RoleUtilisateur role);
}