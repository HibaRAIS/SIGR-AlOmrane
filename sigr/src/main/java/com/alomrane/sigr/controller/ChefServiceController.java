package com.alomrane.sigr.controller;

import com.alomrane.sigr.config.JwtUtil;
import com.alomrane.sigr.model.DemandeInterne;
import com.alomrane.sigr.model.Employe;
import com.alomrane.sigr.repository.DemandeInterneRepository;
import com.alomrane.sigr.repository.EmployeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chef")
@RequiredArgsConstructor
public class ChefServiceController {

    private final EmployeRepository employeRepository;
    private final DemandeInterneRepository demandeRepository;
    private final JwtUtil jwtUtil;

    // GET /api/chef/demandes → toutes les demandes de l'équipe
    @GetMapping("/demandes")
    public ResponseEntity<?> getDemandesEquipe(
            @RequestHeader("Authorization") String authHeader) {

        Long managerId = extractManagerId(authHeader);
        List<Long> equipeIds = getEquipeIds(managerId);

        List<DemandeInterne> demandes =
                demandeRepository.findByEmploye_IdInOrderByDateCreationDesc(equipeIds);

        return ResponseEntity.ok(demandes);
    }

    // GET /api/chef/demandes/en-attente → seulement les demandes EN_ATTENTE
    @GetMapping("/demandes/en-attente")
    public ResponseEntity<?> getDemandesEnAttente(
            @RequestHeader("Authorization") String authHeader) {

        Long managerId = extractManagerId(authHeader);
        List<Long> equipeIds = getEquipeIds(managerId);

        List<DemandeInterne> demandes =
                demandeRepository.findByEmploye_IdInAndStatutOrderByDateCreationDesc(
                        equipeIds, DemandeInterne.Statut.EN_ATTENTE);

        return ResponseEntity.ok(demandes);
    }

    // GET /api/chef/stats → compteurs pour les cards du dashboard
    @GetMapping("/stats")
    public ResponseEntity<?> getStats(
            @RequestHeader("Authorization") String authHeader) {

        Long managerId = extractManagerId(authHeader);
        List<Long> equipeIds = getEquipeIds(managerId);

        long total = demandeRepository
                .findByEmploye_IdInOrderByDateCreationDesc(equipeIds).size();
        long enAttente = demandeRepository
                .findByEmploye_IdInAndStatutOrderByDateCreationDesc(
                        equipeIds, DemandeInterne.Statut.EN_ATTENTE).size();
        long approuvees = demandeRepository
                .findByEmploye_IdInAndStatutOrderByDateCreationDesc(
                        equipeIds, DemandeInterne.Statut.APPROUVEE).size();
        long refusees = demandeRepository
                .findByEmploye_IdInAndStatutOrderByDateCreationDesc(
                        equipeIds, DemandeInterne.Statut.REFUSEE).size();

        return ResponseEntity.ok(Map.of(
                "total", total,
                "enAttente", enAttente,
                "approuvees", approuvees,
                "refusees", refusees
        ));
    }

    // ─── helpers privés ───────────────────────────────────────────
    private Long extractManagerId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtUtil.extractEmployeId(token);
    }

    private List<Long> getEquipeIds(Long managerId) {
        return employeRepository.findByManager_Id(managerId)
                .stream()
                .map(Employe::getId)
                .toList();
    }
}