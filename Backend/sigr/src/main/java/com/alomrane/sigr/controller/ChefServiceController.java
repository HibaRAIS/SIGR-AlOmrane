package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.request.AjusterDemandeRequest;
import com.alomrane.sigr.dto.request.AnnoterDemandeRequest;
import com.alomrane.sigr.dto.response.DemandeResponse;
import com.alomrane.sigr.dto.request.RejeterDemandeRequest;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.service.DemandeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chef")
@RequiredArgsConstructor
public class ChefServiceController {

    private final DemandeService demandeService;

    // Endpoint générique avec filtrage optionnel
    @GetMapping("/demandes")
    public List<DemandeResponse> getDemandes(@RequestParam(required = false) String statut,
                                             @AuthenticationPrincipal Utilisateur user) {
        return demandeService.getDemandesPourChef(user, statut);
    }

    // Endpoint conservé pour la compatibilité (optionnel)
    @GetMapping("/demandes/en-attente")
    public List<DemandeResponse> demandesEnAttente(@AuthenticationPrincipal Utilisateur user) {
        return demandeService.getDemandesAValider(user);
    }

    @PutMapping("/demandes/{id}/approuver")
    public DemandeResponse approuver(@PathVariable Long id,
                                     @AuthenticationPrincipal Utilisateur user) {
        return demandeService.approuver(id, user);
    }

    @PutMapping("/demandes/{id}/rejeter")
    public DemandeResponse rejeter(@PathVariable Long id,
                                   @RequestBody RejeterDemandeRequest request,
                                   @AuthenticationPrincipal Utilisateur user) {
        return demandeService.rejeter(id, request, user);
    }

    @PutMapping("/demandes/{id}/ajuster")
    public DemandeResponse ajuster(@PathVariable Long id,
                                   @RequestBody AjusterDemandeRequest request,
                                   @AuthenticationPrincipal Utilisateur user) {
        return demandeService.ajusterQuantites(id, request, user);
    }

    @PutMapping("/demandes/{id}/annoter")
    public DemandeResponse annoter(@PathVariable Long id,
                                   @RequestBody AnnoterDemandeRequest request,
                                   @AuthenticationPrincipal Utilisateur user) {
        return demandeService.annoterDemande(id, request, user);
    }
}