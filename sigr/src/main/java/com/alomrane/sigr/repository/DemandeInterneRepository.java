package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.DemandeInterne;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DemandeInterneRepository extends JpaRepository<DemandeInterne, Long> {

    List<DemandeInterne> findByEmployeIdOrderByDateCreationDesc(Long employeId);

    List<DemandeInterne> findByValideurIdAndStatutOrderByDateCreationDesc(
            Long valideurId, DemandeInterne.Statut statut
    );

    List<DemandeInterne> findByEmploye_IdInOrderByDateCreationDesc(List<Long> employeIds);

    List<DemandeInterne> findByEmploye_IdInAndStatutOrderByDateCreationDesc(
            List<Long> employeIds, DemandeInterne.Statut statut
    );
}