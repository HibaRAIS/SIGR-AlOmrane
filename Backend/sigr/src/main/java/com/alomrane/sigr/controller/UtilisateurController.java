package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.request.UtilisateurRequest;
import com.alomrane.sigr.dto.response.UtilisateurDto;
import com.alomrane.sigr.service.UtilisateurService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UtilisateurDto>> getAll() {
        return ResponseEntity.ok(utilisateurService.getAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN_SI')") // Adapter selon vos rôles
    public ResponseEntity<UtilisateurDto> create(@Valid @RequestBody UtilisateurRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(utilisateurService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN_SI')")
    public ResponseEntity<UtilisateurDto> update(@PathVariable Long id, @Valid @RequestBody UtilisateurRequest request) {
        return ResponseEntity.ok(utilisateurService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN_SI')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        utilisateurService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-delete")
    @PreAuthorize("hasRole('ADMIN_SI')")
    public ResponseEntity<Void> bulkDelete(@RequestBody List<Long> ids) {
        utilisateurService.bulkDelete(ids);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-status")
    @PreAuthorize("hasRole('ADMIN_SI')")
    public ResponseEntity<Void> bulkStatus(@RequestParam boolean actif, @RequestBody List<Long> ids) {
        utilisateurService.bulkUpdateStatus(ids, actif);
        return ResponseEntity.ok().build();
    }
}