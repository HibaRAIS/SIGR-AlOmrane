package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.response.NotificationResponse;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.config.SecurityUtils;
import com.alomrane.sigr.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Utilisateur currentUser = securityUtils.getCurrentUser();
        return ResponseEntity.ok(notificationService.getMesNotifications(currentUser, page, size));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadCount() {
        Utilisateur currentUser = securityUtils.getCurrentUser();
        return ResponseEntity.ok(notificationService.compterNonLues(currentUser));
    }

    @GetMapping("/unread/latest")
    public ResponseEntity<List<NotificationResponse>> getLatestUnread() {
        Utilisateur currentUser = securityUtils.getCurrentUser();
        return ResponseEntity.ok(notificationService.getDernieresNonLues(currentUser));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        Utilisateur currentUser = securityUtils.getCurrentUser();
        notificationService.marquerCommeLu(currentUser, id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        Utilisateur currentUser = securityUtils.getCurrentUser();
        notificationService.marquerToutCommeLu(currentUser);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Utilisateur currentUser = securityUtils.getCurrentUser();
        notificationService.supprimerNotification(currentUser, id);
        return ResponseEntity.noContent().build();
    }
}