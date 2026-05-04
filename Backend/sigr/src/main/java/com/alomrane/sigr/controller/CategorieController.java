// controller/CategorieController.java
package com.alomrane.sigr.controller;

import com.alomrane.sigr.model.Categorie;
import com.alomrane.sigr.repository.CategorieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategorieController {

    private final CategorieRepository categorieRepository;

    @GetMapping
    public ResponseEntity<List<Categorie>> getCategories() {
        // Récupère toutes les catégories avec leurs sous-catégories (grâce à FetchType.LAZY, attention aux N+1)
        List<Categorie> racines = categorieRepository.findByParentIsNull();
        return ResponseEntity.ok(racines);
    }
}