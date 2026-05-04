// controller/TicketSupportController.java
package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.request.CreerTicketRequest;
import com.alomrane.sigr.dto.request.RechercheTicketRequest;
import com.alomrane.sigr.dto.response.TicketResponse;
import com.alomrane.sigr.exception.BusinessException;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.service.TicketSupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class TicketSupportController {

    private final TicketSupportService ticketService;

    // Employé
    @PostMapping("/tickets")
    public ResponseEntity<TicketResponse> creerTicket(@AuthenticationPrincipal Utilisateur user,
                                                      @Valid @RequestBody CreerTicketRequest request) {
        return ResponseEntity.ok(ticketService.creerTicket(user, request));
    }

    @GetMapping("/tickets")
    public ResponseEntity<List<TicketResponse>> getMesTickets(@AuthenticationPrincipal Utilisateur user) {
        return ResponseEntity.ok(ticketService.getMesTickets(user));
    }

    // Admin
    @GetMapping("/admin/tickets")
    @PreAuthorize("hasRole('ADMIN_SI')")
    public ResponseEntity<List<TicketResponse>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @PutMapping("/admin/tickets/{id}/repondre")
    @PreAuthorize("hasRole('ADMIN_SI')")
    public ResponseEntity<TicketResponse> repondreTicket(@PathVariable Long id,
                                                         @RequestBody Map<String, String> payload,
                                                         @AuthenticationPrincipal Utilisateur admin) {
        String reponse = payload.get("reponse");
        if (reponse == null || reponse.isBlank()) {
            throw new BusinessException("La réponse ne peut pas être vide");
        }
        return ResponseEntity.ok(ticketService.repondreTicket(id, reponse, admin));
    }


    @GetMapping("/admin/tickets/recherche")
    @PreAuthorize("hasRole('ADMIN_SI')")
    public ResponseEntity<Page<TicketResponse>> rechercherTickets(@ModelAttribute RechercheTicketRequest request) {
        Page<TicketResponse> page = ticketService.rechercherTickets(request);
        return ResponseEntity.ok(page);
    }

    @PutMapping("/admin/tickets/{id}/statut")
    @PreAuthorize("hasRole('ADMIN_SI')")
    public ResponseEntity<TicketResponse> changerStatut(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String nouveauStatut = payload.get("statut");
        return ResponseEntity.ok(ticketService.changerStatut(id, nouveauStatut));
    }

    // Modifier la réponse (solution)
    @PutMapping("/admin/tickets/{id}/reponse")
    @PreAuthorize("hasRole('ADMIN_SI')")
    public ResponseEntity<TicketResponse> modifierReponse(@PathVariable Long id,
                                                          @RequestBody Map<String, String> payload) {
        String nouvelleReponse = payload.get("reponse");
        if (nouvelleReponse == null || nouvelleReponse.isBlank()) {
            throw new BusinessException("La réponse ne peut pas être vide");
        }
        return ResponseEntity.ok(ticketService.modifierReponse(id, nouvelleReponse));
    }

    // Supprimer la réponse
    @DeleteMapping("/admin/tickets/{id}/reponse")
    @PreAuthorize("hasRole('ADMIN_SI')")
    public ResponseEntity<Void> supprimerReponse(@PathVariable Long id) {
        ticketService.supprimerReponse(id);
        return ResponseEntity.ok().build();
    }
}