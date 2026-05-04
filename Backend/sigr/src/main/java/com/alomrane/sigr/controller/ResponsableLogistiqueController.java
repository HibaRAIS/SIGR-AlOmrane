package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.response.BonSortieResponse;
import com.alomrane.sigr.dto.response.DemandeResponse;
import com.alomrane.sigr.model.BonSortie;
import com.alomrane.sigr.model.DemandeInterne;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.service.DemandeService;
import com.alomrane.sigr.service.SortieService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/responsable")
@RequiredArgsConstructor
public class ResponsableLogistiqueController {

    private final DemandeService demandeService;
    private final SortieService sortieService;

    @GetMapping("/demandes/validees")
    public List<DemandeResponse> demandesValidees() {
        return demandeService.getDemandesValidees();
    }

    @PostMapping("/sorties/preparer/{demandeId}")
    public BonSortieResponse preparerSortie(@PathVariable Long demandeId,
                                            @AuthenticationPrincipal Utilisateur user) {
        return sortieService.preparerSortie(demandeId, user);
    }

    @PutMapping("/sorties/{bonId}/livrer")
    public BonSortieResponse livrerSortie(@PathVariable Long bonId,
                                          @RequestBody String signature) {
        return sortieService.livrerSortie(bonId, signature);
    }
}