package com.alomrane.sigr.controller;

import com.alomrane.sigr.service.MouvementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/mouvements")
@RequiredArgsConstructor
public class MouvementIntegriteController {

    private final MouvementService mouvementService;

    /**
     * Vérifie l'intégrité de toute la chaîne de mouvements.
     */
    @GetMapping("/verifier-integrite")
    @PreAuthorize("hasAnyRole('RESPONSABLE_LOGISTIQUE','ADMIN_SI')")
    public ResponseEntity<Map<String, Boolean>> verifierIntegrite() {
        boolean integrite = mouvementService.verifierIntegriteChaine();
        return ResponseEntity.ok(Map.of("integrite", integrite));
    }

    /**
     * Vérifie l'intégrité d'un seul mouvement (par son ID).
     * Retourne les hashs stocké et recalculé pour diagnostic.
     */
    @GetMapping("/verifier-integrite/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_LOGISTIQUE','ADMIN_SI')")
    public ResponseEntity<Map<String, Object>> verifierIntegriteMouvement(@PathVariable Long id) {
        return ResponseEntity.ok(mouvementService.verifierIntegriteMouvement(id));
    }

    /*
     * Endpoint de migration – désactivé après usage.
     *

     */



    @PostMapping("/regenerer-hash")
    @PreAuthorize("hasRole('ADMIN_SI')")
    public ResponseEntity<String> regenererHash() {
        mouvementService.regenererTousLesHash();
        return ResponseEntity.ok("Hashs régénérés avec succès.");
    }











}