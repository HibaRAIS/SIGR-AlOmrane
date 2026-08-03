// FournisseurRepository.java
package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.Fournisseur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FournisseurRepository extends JpaRepository<Fournisseur, Long> {

    Optional<Fournisseur> findByIce(String ice);

    @Query("SELECT f FROM Fournisseur f ORDER BY f.code DESC LIMIT 1")
    Optional<Fournisseur> findTopByOrderByCodeDesc();

    Optional<Fournisseur> findByRaisonSociale(String raisonSociale);

}