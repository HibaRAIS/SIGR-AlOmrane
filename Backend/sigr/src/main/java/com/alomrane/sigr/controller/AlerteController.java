package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.response.AlerteResponse;
import com.alomrane.sigr.service.AlerteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alertes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('RESPONSABLE_LOGISTIQUE')")
public class AlerteController {

    private final AlerteService alerteService;

    @GetMapping
    public ResponseEntity<List<AlerteResponse>> getAlertes(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean traitee,
            @RequestParam(required = false) Boolean ignoree
    ) {
        return ResponseEntity.ok(alerteService.getAlertes(search, type, traitee, ignoree));
    }

    @PutMapping("/{id}/traiter")
    public ResponseEntity<AlerteResponse> traiter(@PathVariable Long id) {
        return ResponseEntity.ok(alerteService.marquerTraitee(id));
    }

    @PutMapping("/{id}/ignorer")
    public ResponseEntity<AlerteResponse> ignorer(@PathVariable Long id) {
        return ResponseEntity.ok(alerteService.marquerIgnoree(id));
    }

    @PutMapping("/{id}/reactiver")
    public ResponseEntity<AlerteResponse> reactiver(@PathVariable Long id) {
        return ResponseEntity.ok(alerteService.reactiver(id));
    }
}