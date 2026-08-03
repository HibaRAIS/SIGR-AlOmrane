package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.response.CategorieResponse;
import com.alomrane.sigr.model.Categorie;
import com.alomrane.sigr.repository.CategorieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategorieService {

    private final CategorieRepository categorieRepository;

    /**
     * Retourne l'arborescence complète des catégories avec le nombre d'articles.
     */
    public List<CategorieResponse> getArborescence() {
        List<Categorie> toutes = categorieRepository.findAll();
        if (toutes.isEmpty()) return Collections.emptyList();

        // Map id -> nombre d'articles
        Map<Long, Integer> nbArticlesMap = categorieRepository.countProduitsParCategorie()
                .stream()
                .collect(Collectors.toMap(
                        obj -> (Long) obj[0],
                        obj -> ((Number) obj[1]).intValue()
                ));

        // Regrouper les catégories par parentId
        Map<Long, List<Categorie>> childrenMap = new HashMap<>();
        List<Categorie> racines = new ArrayList<>();
        for (Categorie c : toutes) {
            if (c.getParent() == null) {
                racines.add(c);
            } else {
                childrenMap
                        .computeIfAbsent(c.getParent().getId(), k -> new ArrayList<>())
                        .add(c);
            }
        }

        // Construction récursive du DTO
        return racines.stream()
                .map(root -> toCategorieResponse(root, childrenMap, nbArticlesMap))
                .collect(Collectors.toList());
    }

    private CategorieResponse toCategorieResponse(
            Categorie cat,
            Map<Long, List<Categorie>> childrenMap,
            Map<Long, Integer> nbArticlesMap) {
        Long parentId = cat.getParent() != null ? cat.getParent().getId() : null;
        int nbArticles = nbArticlesMap.getOrDefault(cat.getId(), 0);
        List<CategorieResponse> sousCats = childrenMap
                .getOrDefault(cat.getId(), Collections.emptyList())
                .stream()
                .map(enfant -> toCategorieResponse(enfant, childrenMap, nbArticlesMap))
                .collect(Collectors.toList());
        return new CategorieResponse(
                cat.getId(),
                cat.getNom(),
                parentId,
                nbArticles,
                sousCats
        );
    }

    // ----- CRUD -----

    @Transactional
    public CategorieResponse creer(String nom, Long parentId) {
        Categorie parent = parentId != null
                ? categorieRepository.findById(parentId)
                .orElseThrow(() -> new NoSuchElementException("Catégorie parente introuvable"))
                : null;
        Categorie categorie = Categorie.builder()
                .nom(nom)
                .parent(parent)
                .build();
        Categorie saved = categorieRepository.save(categorie);
        // Recharge pour avoir l'objet complet avec les relations lazy ?
        // On va simplement reconstruire une réponse simple.
        return toSimpleResponse(saved);
    }

    @Transactional
    public CategorieResponse modifier(Long id, String nom, Long parentId) {
        Categorie categorie = categorieRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Catégorie introuvable"));
        if (nom != null && !nom.isBlank()) {
            categorie.setNom(nom);
        }
        if (parentId != null) {
            Categorie parent = categorieRepository.findById(parentId)
                    .orElseThrow(() -> new NoSuchElementException("Parent introuvable"));
            categorie.setParent(parent);
        }
        Categorie saved = categorieRepository.save(categorie);
        return toSimpleResponse(saved);
    }

    @Transactional
    public void supprimer(Long id) {
        if (!categorieRepository.existsById(id)) {
            throw new NoSuchElementException("Catégorie introuvable");
        }
        // La cascade ALL supprimera automatiquement les sous-catégories et les produits liés
        categorieRepository.deleteById(id);
    }

    private CategorieResponse toSimpleResponse(Categorie cat) {
        Long parentId = cat.getParent() != null ? cat.getParent().getId() : null;
        // Pour une réponse simple, on peut omettre les sous-catégories ou les charger
        return new CategorieResponse(
                cat.getId(),
                cat.getNom(),
                parentId,
                0, // pas idéal, on pourrait le compter, mais comme on fait un refresh après création on relance l'arborescence côté front
                Collections.emptyList()
        );
    }
}