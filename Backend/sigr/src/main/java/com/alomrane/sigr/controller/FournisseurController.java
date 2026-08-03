// FournisseurController.java
package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.request.BulkDeleteRequest;
import com.alomrane.sigr.dto.request.CreateFournisseurRequest;
import com.alomrane.sigr.dto.request.UpdateFournisseurRequest;
import com.alomrane.sigr.model.Fournisseur;
import com.alomrane.sigr.service.FournisseurService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fournisseurs")
@RequiredArgsConstructor
public class FournisseurController {

    private final FournisseurService service;

    @GetMapping
    public ResponseEntity<List<Fournisseur>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Fournisseur> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<Fournisseur> create(@Valid @RequestBody CreateFournisseurRequest request) {
        Fournisseur created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Fournisseur> update(@PathVariable Long id,
                                              @Valid @RequestBody UpdateFournisseurRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<Void> bulkDelete(@Valid @RequestBody BulkDeleteRequest request) {
        service.bulkDelete(request.getIds());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Fournisseur>> bulkCreate(@Valid @RequestBody List<CreateFournisseurRequest> requests) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.bulkCreate(requests));
    }
}