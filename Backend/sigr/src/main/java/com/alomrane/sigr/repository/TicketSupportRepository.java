// repository/TicketSupportRepository.java
package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.TicketSupport;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.model.enums.StatutTicket;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketSupportRepository extends JpaRepository<TicketSupport, Long>, JpaSpecificationExecutor<TicketSupport> {
    List<TicketSupport> findByUtilisateurOrderByDateCreationDesc(Utilisateur utilisateur);
    List<TicketSupport> findAllByOrderByDateCreationDesc();
    List<TicketSupport> findByStatutOrderByDateCreationAsc(StatutTicket statut);

    @Modifying
    @Query("UPDATE TicketSupport t SET t.reponse = :reponse WHERE t.id = :id")
    int updateReponseOnly(@Param("id") Long id, @Param("reponse") String reponse);
}