package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.request.*;
import com.alomrane.sigr.dto.response.*;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.service.SortieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/responsable")
@RequiredArgsConstructor
public class ResponsableLogistiqueController {

    private final SortieService sortieService;

    // 1. Liste des demandes (tous statuts sauf EN_VALIDATION) avec filtres
    @GetMapping("/demandes")
    public List<DemandeResponseResponsable> getDemandes(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String priorite,
            @RequestParam(required = false) String search) {
        return sortieService.getDemandesPourResponsable(statut, priorite, search);
    }

    // 2. Refuser une demande VALIDEE
    @PostMapping("/demandes/{id}/refuser")
    public DemandeResponse refuserDemande(@PathVariable Long id,
                                          @RequestBody @Valid RefusResponsableRequest request,
                                          @AuthenticationPrincipal Utilisateur user) {
        return sortieService.refuserDemande(id, request.motif(), user);
    }

    // 3. Lancer la préparation (créer un BonSortie)
    @PostMapping("/sorties/preparer/{demandeId}")
    public BonSortieDetailResponse preparerSortie(@PathVariable Long demandeId,
                                                  @AuthenticationPrincipal Utilisateur user) {
        return sortieService.preparerSortie(demandeId, user);
    }

    // 4. Détail d'un bon de sortie (préparation)
    @GetMapping("/sorties/{bonId}")
    public BonSortieDetailResponse getBonSortie(@PathVariable Long bonId) {
        return sortieService.getBonSortieDetail(bonId);
    }

    // 5. Sauvegarder les lignes de préparation
    @PutMapping("/sorties/{bonId}/lignes")
    public BonSortieDetailResponse sauvegarderPreparation(@PathVariable Long bonId,
                                                          @RequestBody @Valid PreparationRequest request) {
        return sortieService.mettreAJourPreparation(bonId, request);
    }

    // 6. Enregistrer les signatures (brouillon)
    @PostMapping("/sorties/{bonId}/signatures")
    public BonSortieDetailResponse enregistrerSignatures(@PathVariable Long bonId,
                                                         @RequestBody List<SignatureRequest> signatures) {
        return sortieService.enregistrerSignatures(bonId, signatures);
    }

    // 7. Livrer (valider le bon, déduire stock, mouvements, signatures)
    @PostMapping("/sorties/{bonId}/livrer")
    public AccuseResponse livrerSortie(@PathVariable Long bonId,
                                       @RequestBody @Valid LivraisonRequest request,
                                       @AuthenticationPrincipal Utilisateur user) {
        return sortieService.livrerSortie(bonId, request, user);
    }

    // 8. Accusé de réception (données pour affichage)
    @GetMapping("/demandes/{id}/accuse")
    public AccuseResponse getAccuse(@PathVariable Long id) {
        return sortieService.getAccuseData(id);
    }

    // 9. Import scan d'accusé
    @PostMapping("/demandes/{id}/scan")
    public void uploadScanAccuse(@PathVariable Long id,
                                 @RequestParam("file") MultipartFile file) {
        sortieService.uploadScanAccuse(id, file);
    }

    @GetMapping("/demandes/{id}/details")
    public DemandeDetailResponse getDemandeDetail(@PathVariable Long id) {
        return sortieService.getDemandeDetail(id);
    }
}