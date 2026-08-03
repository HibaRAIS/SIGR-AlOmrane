// controller/StructureController.java
package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.request.CreateStructureRequest;
import com.alomrane.sigr.dto.response.StructureFlatDto;
import com.alomrane.sigr.service.StructureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/structures")
@RequiredArgsConstructor
public class StructureController {

    private final StructureService service;

    @GetMapping("/flat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<StructureFlatDto>> getAllFlat() {
        return ResponseEntity.ok(service.getAllFlat());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_SI')")
    public ResponseEntity<StructureFlatDto> create(@Valid @RequestBody CreateStructureRequest request) {
        var created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new StructureFlatDto(created.getId(), created.getNom(),
                        created.getCodeAnalytique(), created.getType().name(),
                        created.getSite(),
                        created.getParent() != null ? created.getParent().getId() : null));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_SI')")
    public ResponseEntity<StructureFlatDto> update(@PathVariable Long id,
                                                   @Valid @RequestBody CreateStructureRequest request) {
        var updated = service.update(id, request);
        return ResponseEntity.ok(new StructureFlatDto(updated.getId(), updated.getNom(),
                updated.getCodeAnalytique(), updated.getType().name(),
                updated.getSite(),
                updated.getParent() != null ? updated.getParent().getId() : null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_SI')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}