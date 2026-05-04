package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.request.CreerDemandeRequest;
import com.alomrane.sigr.dto.response.DemandeResponse;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.service.DemandeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/demandes")
@RequiredArgsConstructor
public class DemandeController {

    private final DemandeService demandeService;

    @PostMapping
    public DemandeResponse creer(@RequestBody CreerDemandeRequest request,
                                 @AuthenticationPrincipal Utilisateur user) {
        return demandeService.creerDemande(request, user);
    }

    @GetMapping("/mes-demandes")
    public List<DemandeResponse> mesDemandes(@AuthenticationPrincipal Utilisateur user) {
        return demandeService.getMesDemandes(user);
    }


    @PutMapping("/{id}")
    public DemandeResponse modifierDemande(@PathVariable Long id,
                                           @RequestBody CreerDemandeRequest request,
                                           @AuthenticationPrincipal Utilisateur user) {
        return demandeService.modifierDemande(id, request, user);
    }

    @DeleteMapping("/{id}")
    public void supprimerDemande(@PathVariable Long id,
                                 @AuthenticationPrincipal Utilisateur user) {
        demandeService.supprimerDemande(id, user);
    }
}