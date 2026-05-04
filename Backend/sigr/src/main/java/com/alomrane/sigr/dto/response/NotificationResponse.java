package com.alomrane.sigr.dto.response;

import com.alomrane.sigr.model.Notification;
import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String type,
        String titre,
        String message,
        String details,
        String lien,
        boolean lu,
        LocalDateTime dateCreation,
        String tempsRelatif
) {
    public static NotificationResponse fromEntity(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType().name(),
                n.getTitre(),
                n.getMessage(),
                n.getDetails(),
                n.getLien(),
                n.isLu(),
                n.getDateCreation(),
                calculTempsRelatif(n.getDateCreation())
        );
    }

    private static String calculTempsRelatif(LocalDateTime date) {
        // Implémentation simple – vous pouvez utiliser une librairie comme "ocpsoft.prettytime"
        // À adapter selon vos besoins
        return "Il y a " + java.time.Duration.between(date, LocalDateTime.now()).toHours() + " heures";
    }
}