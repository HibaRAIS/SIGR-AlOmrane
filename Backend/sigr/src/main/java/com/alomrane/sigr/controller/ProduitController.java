package com.alomrane.sigr.controller;

import com.alomrane.sigr.model.Produit;
import com.alomrane.sigr.repository.ProduitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/produits")
@RequiredArgsConstructor
public class ProduitController {

    private final ProduitRepository produitRepository;

    public record ProduitPublicDTO(
            Long id,
            String codeArticle,
            String designation,
            String description,
            String uniteMesure,
            Long categorieId,
            String imageUrl,
            // Fiche technique
            BigDecimal poidsUnitaire,
            String dimensions,
            String materiau,
            String instructionsSecurite
    ) {}

    @GetMapping("/public")
    public List<ProduitPublicDTO> getPublicCatalogue() {
        List<Produit> produits = produitRepository.findAllWithCategorieAndFicheTechnique();
        return produits.stream()
                .map(p -> {
                    var fiche = p.getFicheTechnique();
                    return new ProduitPublicDTO(
                            p.getId(),
                            p.getCodeArticle(),
                            p.getDesignation(),
                            p.getDescription(),
                            p.getUniteMesure(),
                            p.getCategorie() != null ? p.getCategorie().getId() : null,
                            p.getImageUrl(),
                            fiche != null ? fiche.getPoidsUnitaire() : null,
                            fiche != null ? fiche.getDimensions() : null,
                            fiche != null ? fiche.getMateriau() : null,
                            fiche != null ? fiche.getInstructionsSecurite() : null
                    );
                })
                .toList();
    }
}