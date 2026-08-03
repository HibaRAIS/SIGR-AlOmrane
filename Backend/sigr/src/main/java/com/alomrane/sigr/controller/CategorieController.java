// controller/CategorieController.java
package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.response.CategorieResponse;
import com.alomrane.sigr.service.CategorieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategorieController {

    private final CategorieService categorieService;

    // Unique endpoint pour la lecture de l'arborescence
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CategorieResponse>> getArborescence() {
        return ResponseEntity.ok(categorieService.getArborescence());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<CategorieResponse> creer(@RequestBody Map<String, Object> body) {
        String nom = (String) body.get("nom");
        if (nom == null || nom.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Long parentId = parseParentId(body.get("parentId"));
        CategorieResponse response = categorieService.creer(nom, parentId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<CategorieResponse> modifier(@PathVariable Long id,
                                                      @RequestBody Map<String, Object> body) {
        String nom = (String) body.get("nom");
        Long parentId = parseParentId(body.get("parentId"));
        CategorieResponse response = categorieService.modifier(id, nom, parentId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        categorieService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    private Long parseParentId(Object parentIdObj) {
        if (parentIdObj == null) return null;
        String str = parentIdObj.toString();
        if (str.equals("root") || str.equals("null") || str.isBlank()) {
            return null;
        }
        return Long.valueOf(str);
    }
}