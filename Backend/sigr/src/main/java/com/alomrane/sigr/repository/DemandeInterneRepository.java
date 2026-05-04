package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.DemandeInterne;
import com.alomrane.sigr.model.enums.StatutDemande;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DemandeInterneRepository extends JpaRepository<DemandeInterne, Long> {

    List<DemandeInterne> findByEmployeIdOrderByDateDemandeDesc(Long employeId);

    List<DemandeInterne> findByValideurIdAndStatutOrderByDateDemandeDesc(Long valideurId, StatutDemande statut);

    // Nouvelle méthode pour lister les demandes validées
    List<DemandeInterne> findByStatutOrderByDateDemandeDesc(StatutDemande statut);

    // Nouvelle méthode : toutes les demandes dont le valideur est ce chef (sans filtre statut)
    List<DemandeInterne> findByValideurIdOrderByDateDemandeDesc(Long valideurId);
}
