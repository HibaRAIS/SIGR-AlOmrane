package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.DemandeInterne;
import com.alomrane.sigr.model.enums.StatutDemande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DemandeInterneRepository extends JpaRepository<DemandeInterne, Long> {

    List<DemandeInterne> findByEmployeIdOrderByDateDemandeDesc(Long employeId);

    List<DemandeInterne> findByValideurIdAndStatutOrderByDateDemandeDesc(Long valideurId, StatutDemande statut);

    // Nouvelle méthode pour lister les demandes validées
    List<DemandeInterne> findByStatutOrderByDateDemandeDesc(StatutDemande statut);

    // Nouvelle méthode : toutes les demandes dont le valideur est ce chef (sans filtre statut)
    List<DemandeInterne> findByValideurIdOrderByDateDemandeDesc(Long valideurId);

    List<DemandeInterne> findByStatutNotIn(List<StatutDemande> statuts);


    @Query("SELECT d FROM DemandeInterne d " +
            "JOIN FETCH d.employe e " +
            "JOIN FETCH e.structure " +
            "LEFT JOIN FETCH d.validePar v " +
            "LEFT JOIN FETCH v.employe ve " +
            "LEFT JOIN FETCH d.bonsSortie " +
            "WHERE d.id = :id")
    Optional<DemandeInterne> findByIdWithDetails(@Param("id") Long id);


    Optional<DemandeInterne> findByNumeroDemande(String numeroDemande);


    long countByStatut(StatutDemande statut);
}
