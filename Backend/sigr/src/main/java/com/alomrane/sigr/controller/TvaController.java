package com.alomrane.sigr.controller;


import com.alomrane.sigr.dto.response.TvaResponse;
import com.alomrane.sigr.model.Tva;
import com.alomrane.sigr.service.TvaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tvas")
@RequiredArgsConstructor
public class TvaController {

    private final TvaService tvaService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TvaResponse>> getAll() {
        return ResponseEntity.ok(tvaService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TvaResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(tvaService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<TvaResponse> create(@Valid @RequestBody Tva tva) {
        tva.setId(null); // s'assurer que l'ID n'est pas forcé
        TvaResponse response = tvaService.create(tva);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<TvaResponse> update(@PathVariable Long id, @Valid @RequestBody Tva tva) {
        TvaResponse response = tvaService.update(id, tva);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tvaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}