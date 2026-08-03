// src/main/java/com/alomrane/sigr/controller/ReceptionController.java
package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.request.BonEntreeSignaturesDto;
import com.alomrane.sigr.dto.request.ReceptionCreateRequest;
import com.alomrane.sigr.dto.response.DocumentJointReceptionResponse;
import com.alomrane.sigr.dto.response.ReceptionResponse;
import com.alomrane.sigr.dto.response.ReliquatResponse;
import com.alomrane.sigr.dto.response.StatsReceptionsResponse;
import com.alomrane.sigr.service.ReceptionService;
import com.alomrane.sigr.config.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/receptions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('RESPONSABLE_LOGISTIQUE')")
public class ReceptionController {

    private final ReceptionService receptionService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public Page<ReceptionResponse> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String fournisseur,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin
    ) {
        Sort sortObj = Sort.by(Sort.Direction.fromString(direction), sort);
        return receptionService.getReceptions(PageRequest.of(page, size, sortObj),
                search, statut, fournisseur, dateDebut, dateFin);
    }

    @GetMapping("/stats")
    public StatsReceptionsResponse getStats() {
        return receptionService.getStats();
    }

    @GetMapping("/{id}")
    public ReceptionResponse getOne(@PathVariable Long id) {
        return receptionService.getOne(id);
    }

    @PostMapping
    public ReceptionResponse create(@Valid @RequestBody ReceptionCreateRequest req) {
        return receptionService.createReception(req, securityUtils.getCurrentUser().getLoginLdap());
    }

    @PutMapping("/{id}/confirmer")
    public ReceptionResponse confirmer(@PathVariable Long id) {
        return receptionService.confirmerReception(id, securityUtils.getCurrentUser().getLoginLdap());
    }

    @GetMapping("/reliquats")
    public List<ReliquatResponse> getAllReliquats() {
        return receptionService.getAllReliquats();
    }

    @GetMapping("/reliquats/{id}")
    public ReliquatResponse getReliquat(@PathVariable String id) {
        return receptionService.getReliquat(id);
    }

    @PutMapping("/{id}")
    public ReceptionResponse update(@PathVariable Long id, @Valid @RequestBody ReceptionCreateRequest req) {
        return receptionService.updateReception(id, req, securityUtils.getCurrentUser().getLoginLdap());
    }

    @PutMapping("/{id}/signatures")
    public ReceptionResponse saveSignatures(@PathVariable Long id, @Valid @RequestBody BonEntreeSignaturesDto signatures) {
        return receptionService.saveSignatures(id, signatures, securityUtils.getCurrentUser().getLoginLdap());
    }

    // POST /api/receptions/{id}/documents
    @PostMapping("/{id}/documents")
    public DocumentJointReceptionResponse uploadDocument(@PathVariable Long id,
                                                         @RequestParam("file") MultipartFile file) {
        return receptionService.uploadDocument(id, file);
    }

    // DELETE /api/receptions/{receptionId}/documents/{documentId}
    @DeleteMapping("/{receptionId}/documents/{documentId}")
    public void deleteDocument(@PathVariable Long receptionId,
                               @PathVariable Long documentId) {
        receptionService.deleteDocument(receptionId, documentId);
    }
}