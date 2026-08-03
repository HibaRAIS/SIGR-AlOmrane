package com.alomrane.sigr.service;

import com.alomrane.sigr.model.AlerteStock;
import com.alomrane.sigr.model.Produit;
import com.alomrane.sigr.model.StockPhysique;
import com.alomrane.sigr.model.enums.AlerteType;
import com.alomrane.sigr.model.enums.StockStatus;
import com.alomrane.sigr.repository.AlerteStockRepository;
import com.alomrane.sigr.repository.ProduitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlerteGenerationService {

    private final ProduitRepository produitRepository;
    private final AlerteStockRepository alerteStockRepository;

    /**
     * Synchronise les alertes avec l'état réel des stocks.
     * - Supprime les alertes actives (non traitées, non ignorées) pour les produits qui ne sont plus en alerte.
     * - Crée de nouvelles alertes pour les produits en alerte qui n'en ont pas déjà une active.
     * - Conserve les alertes traitées ou ignorées (elles ne sont pas recréées).
     */
    @Transactional
    public void genererToutesLesAlertes() {
        List<Produit> produits = produitRepository.findAll();
        int created = 0;
        int removed = 0;

        for (Produit produit : produits) {
            AlerteType type = determinerTypeAlerte(produit);
            if (type != null) {
                // Vérifie s'il existe déjà une alerte active (non traitée, non ignorée) pour ce produit et ce type
                boolean existeDeja = alerteStockRepository.existsByProduitIdAndTypeAndTraiteeFalseAndIgnoreeFalse(produit.getId(), type);
                if (!existeDeja) {
                    AlerteStock alerte = AlerteStock.builder()
                            .produit(produit)
                            .type(type)
                            .message(construireMessage(type, produit))
                            .dateCreation(LocalDateTime.now())
                            .traitee(false)
                            .ignoree(false)
                            .build();
                    alerteStockRepository.save(alerte);
                    created++;
                }
            } else {
                // Aucune alerte nécessaire : supprimer les alertes actives de ce produit
                List<AlerteStock> actives = alerteStockRepository.findByProduitIdAndTraiteeFalseAndIgnoreeFalse(produit.getId());
                if (!actives.isEmpty()) {
                    alerteStockRepository.deleteAll(actives);
                    removed += actives.size();
                }
            }
        }

        log.info("Génération d'alertes terminée : {} créées, {} supprimées", created, removed);
    }

    private AlerteType determinerTypeAlerte(Produit produit) {
        StockPhysique stock = produit.getStockPhysique();
        if (stock == null) return null;

        int qte = stock.getQuantiteTheorique() != null ? stock.getQuantiteTheorique().intValue() : 0;
        int seuil = produit.getQuantiteMin() != null ? produit.getQuantiteMin().intValue() : 0;

        if (qte <= 0) return AlerteType.CRITIQUE;
        if (qte <= seuil) return AlerteType.FAIBLE;
        // Vous pouvez ajouter un seuil de surveillance si souhaité (ex: qte <= seuil * 1.2)
        return null;
    }

    private String construireMessage(AlerteType type, Produit produit) {
        int qte = produit.getStockPhysique().getQuantiteTheorique().intValue();
        String nom = produit.getDesignation();
        switch (type) {
            case CRITIQUE:
                return String.format("Rupture de stock : %s (stock = %d)", nom, qte);
            case FAIBLE:
                return String.format("Stock faible : %s (stock = %d, seuil = %d)", nom, qte, produit.getQuantiteMin().intValue());
            default:
                return "";
        }
    }
}