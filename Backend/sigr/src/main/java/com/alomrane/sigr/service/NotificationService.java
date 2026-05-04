package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.response.NotificationResponse;
import com.alomrane.sigr.model.Notification;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void envoyerNotification(Utilisateur destinataire,
                                    Notification.TypeNotification type,
                                    String titre,
                                    String message,
                                    String details,
                                    String lien) {
        Notification notif = Notification.builder()
                .utilisateur(destinataire)
                .type(type)
                .titre(titre)
                .message(message)
                .details(details)
                .lien(lien)
                .lu(false)
                .build();
        //notificationRepository.save(notif);
        notificationRepository.saveAndFlush(notif);
    }

    public Page<NotificationResponse> getMesNotifications(Utilisateur user, int page, int size) {
        Page<Notification> pageNotifs = notificationRepository.findByUtilisateurOrderByDateCreationDesc(user, PageRequest.of(page, size));
        return pageNotifs.map(NotificationResponse::fromEntity);
    }

    public List<NotificationResponse> getDernieresNonLues(Utilisateur user) {
        return notificationRepository.findTop10ByUtilisateurAndLuFalseOrderByDateCreationDesc(user)
                .stream().map(NotificationResponse::fromEntity).toList();
    }

    public long compterNonLues(Utilisateur user) {
        return notificationRepository.countByUtilisateurAndLuFalse(user);
    }

    @Transactional
    public void marquerCommeLu(Utilisateur user, Long notificationId) {
        notificationRepository.findById(notificationId)
                .filter(n -> n.getUtilisateur().getId().equals(user.getId()))
                .ifPresent(n -> {
                    n.setLu(true);
                    notificationRepository.save(n);
                });
    }

    @Transactional
    public void marquerToutCommeLu(Utilisateur user) {
        notificationRepository.marquerToutCommeLu(user);
    }

    @Transactional
    public void supprimerNotification(Utilisateur user, Long id) {
        notificationRepository.deleteByUtilisateurAndId(user, id);
    }
}