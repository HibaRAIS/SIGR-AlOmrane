package com.alomrane.sigr.controller;

import com.alomrane.sigr.config.JwtUtil;
import com.alomrane.sigr.dto.*;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.repository.UtilisateurRepository;
import com.alomrane.sigr.service.DemandeService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/demandes")
@RequiredArgsConstructor
public class DemandeController {

    private final DemandeService demandeService;
    private final UtilisateurRepository utilisateurRepo;
    private final JwtUtil jwtUtil;

    private Utilisateur getCurrentUser(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        String email = jwtUtil.extractEmail(token);
        return utilisateurRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
    }

    @PostMapping
    public ResponseEntity<DemandeResponse> creer(
            @RequestBody CreerDemandeRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(
                demandeService.creerDemande(request, getCurrentUser(httpRequest))
        );
    }

    @GetMapping("/mes-demandes")
    public ResponseEntity<List<DemandeResponse>> mesDemandes(HttpServletRequest request) {
        return ResponseEntity.ok(
                demandeService.getMesDemandes(getCurrentUser(request))
        );
    }

    @GetMapping("/a-valider")
    public ResponseEntity<List<DemandeResponse>> aValider(HttpServletRequest request) {
        return ResponseEntity.ok(
                demandeService.getDemandesAValider(getCurrentUser(request))
        );
    }

    @PutMapping("/{id}/approuver")
    public ResponseEntity<DemandeResponse> approuver(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(
                demandeService.approuver(id, getCurrentUser(request))
        );
    }

    @PutMapping("/{id}/rejeter")
    public ResponseEntity<DemandeResponse> rejeter(
            @PathVariable Long id,
            @RequestBody RejeterDemandeRequest body,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(
                demandeService.rejeter(id, body, getCurrentUser(request))
        );
    }
}