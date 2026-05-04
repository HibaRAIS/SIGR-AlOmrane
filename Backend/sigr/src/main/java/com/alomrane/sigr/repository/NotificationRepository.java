package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.Notification;
import com.alomrane.sigr.model.Utilisateur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUtilisateurOrderByDateCreationDesc(Utilisateur utilisateur, Pageable pageable);

    List<Notification> findTop10ByUtilisateurAndLuFalseOrderByDateCreationDesc(Utilisateur utilisateur);

    long countByUtilisateurAndLuFalse(Utilisateur utilisateur);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lu = true WHERE n.utilisateur = :utilisateur AND n.lu = false")
    void marquerToutCommeLu(Utilisateur utilisateur);

    @Modifying
    @Transactional
    void deleteByUtilisateurAndId(Utilisateur utilisateur, Long id);
}