package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.request.ProduitFormRequest;
import com.alomrane.sigr.dto.request.AjustementRequest;
import com.alomrane.sigr.dto.response.ProduitResumeResponse;
import com.alomrane.sigr.dto.response.ProduitDetailResponse;
import com.alomrane.sigr.service.CatalogueService;
import com.alomrane.sigr.config.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/catalogue")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('RESPONSABLE_LOGISTIQUE')")
public class CatalogueController {

    private final CatalogueService catalogueService;
    private final SecurityUtils securityUtils;

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleException(Exception e) {
        log.error("Erreur dans CatalogueController", e);
        String msg = e.getClass().getSimpleName() + " : " + e.getMessage();
        if (msg == null || msg.isBlank()) msg = "Erreur interne du serveur";
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(msg);
    }

    @GetMapping
    public Page<ProduitResumeResponse> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "designation") String sort,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String supplier,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        Sort sortObj = Sort.by(Sort.Direction.fromString(direction), sort);
        return catalogueService.getProduitsPage(PageRequest.of(page, size, sortObj), search, category, location, supplier, status, dateDebut, dateFin);
    }

    @GetMapping("/{id}")
    public ProduitDetailResponse getDetail(@PathVariable Long id) {
        return catalogueService.getProduitDetail(id);
    }

    @PostMapping
    public ProduitDetailResponse create(@RequestBody ProduitFormRequest form) {
        return catalogueService.createProduit(form, securityUtils.getCurrentUser().getLoginLdap());
    }

    @PutMapping("/{id}")
    public ProduitDetailResponse update(@PathVariable Long id, @RequestBody ProduitFormRequest form) {
        return catalogueService.updateProduit(id, form, securityUtils.getCurrentUser().getLoginLdap());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        catalogueService.deleteProduit(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/ajustement")
    public ResponseEntity<?> ajuster(@PathVariable Long id, @RequestBody AjustementRequest request) {
        catalogueService.ajusterStock(id, request.getNouvelleQuantite(),
                request.getMotif(), request.getPrixUnitaire(),
                securityUtils.getCurrentUser().getLoginLdap());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/emplacements")
    public List<String> getEmplacements() {
        return catalogueService.getDistinctEmplacements();
    }

    @PostMapping("/upload-image")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            // Créer le dossier si nécessaire
            Path uploadDir = Paths.get("uploads/produits");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // Générer un nom de fichier unique
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".png";
            String uniqueFilename = UUID.randomUUID().toString() + extension;

            // Sauvegarder le fichier
            Path destination = uploadDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            // Retourner l'URL relative (sera accessible via http://serveur:port/uploads/produits/xxx.png)
            String fileUrl = "/uploads/produits/" + uniqueFilename;
            return ResponseEntity.ok(fileUrl);
        } catch (IOException e) {
            log.error("Erreur lors de l'upload de l'image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'upload");
        }
    }
}