// controller/EmployeController.java
package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.request.CreateEmployeRequest;
import com.alomrane.sigr.dto.response.EmployeDto;
import com.alomrane.sigr.dto.response.EmployeFlatDto;
import com.alomrane.sigr.model.Employe;
import com.alomrane.sigr.repository.EmployeRepository;
import com.alomrane.sigr.service.EmployeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/employes")
@RequiredArgsConstructor
public class EmployeController {

    private final EmployeService employeService;
    private final EmployeRepository employeRepository;

    // ---------- Endpoint existant pour la page Organisation ----------
    @GetMapping("/flat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<EmployeFlatDto>> getAllFlat() {
        List<EmployeFlatDto> list = employeRepository.findAll()
                .stream()
                .map(this::toFlatDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // ---------- Nouveaux endpoints pour la page Employés ----------
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<EmployeDto>> getAll() {
        return ResponseEntity.ok(employeService.getAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_SI')")
    public ResponseEntity<EmployeDto> create(@Valid @RequestBody CreateEmployeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_SI')")
    public ResponseEntity<EmployeDto> update(@PathVariable Long id,
                                             @Valid @RequestBody CreateEmployeRequest request) {
        return ResponseEntity.ok(employeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_SI')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        employeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN_SI')")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id, @RequestParam boolean actif) {
        employeService.updateStatus(id, actif);
        return ResponseEntity.ok().build();
    }

    // Méthode utilitaire conservée pour le /flat
    private EmployeFlatDto toFlatDto(Employe emp) {
        return new EmployeFlatDto(
                emp.getId(),
                emp.getNom(),
                emp.getPrenom(),
                emp.getEmailProfessionnel(),
                emp.getTelephone(),
                emp.getGrade().name(),
                emp.getStructure() != null ? emp.getStructure().getId() : null
        );
    }
}