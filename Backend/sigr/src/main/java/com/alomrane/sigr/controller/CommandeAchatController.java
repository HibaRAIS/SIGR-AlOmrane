package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.request.CommandeAchatRequest;
import com.alomrane.sigr.dto.response.CommandeAchatResponse;
import com.alomrane.sigr.dto.response.StatsCommandesResponse;
import com.alomrane.sigr.service.CommandeAchatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/achats")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('RESPONSABLE_LOGISTIQUE')")
public class CommandeAchatController {

    private final CommandeAchatService commandeService;

    @GetMapping
    public Page<CommandeAchatResponse> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String methode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin
    ) {
        Sort sortObj = Sort.by(Sort.Direction.fromString(direction), sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);
        return commandeService.getCommandes(pageable, search, statut, methode, dateDebut, dateFin);
    }

    @GetMapping("/stats")
    public StatsCommandesResponse getStats() {
        return commandeService.getStats();
    }

    @GetMapping("/{id}")
    public CommandeAchatResponse getOne(@PathVariable Long id) {
        return commandeService.getCommande(id);
    }

    @PostMapping
    public CommandeAchatResponse create(@Valid @RequestBody CommandeAchatRequest request) {
        return commandeService.createCommande(request);
    }

    @PutMapping("/{id}")
    public CommandeAchatResponse update(@PathVariable Long id, @Valid @RequestBody CommandeAchatRequest request) {
        return commandeService.updateCommande(id, request);
    }

    @PutMapping("/{id}/annuler")
    public CommandeAchatResponse annuler(@PathVariable Long id, @RequestParam String motif) {
        return commandeService.annulerCommande(id, motif);
    }

    @PutMapping("/{id}/recevoir")
    public CommandeAchatResponse recevoir(@PathVariable Long id) {
        return commandeService.recevoirCommande(id);
    }

    // Import via fichier (à implémenter)
    @PostMapping("/import")
    public ResponseEntity<List<CommandeAchatResponse>> importer(@RequestParam("file") MultipartFile file) {
        List<CommandeAchatResponse> result = commandeService.importFichier(file);
        return ResponseEntity.ok(result);
    }
}