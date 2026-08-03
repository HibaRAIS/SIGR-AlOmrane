package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.response.AlerteResponse;
import com.alomrane.sigr.model.AlerteStock;
import com.alomrane.sigr.model.Produit;
import com.alomrane.sigr.model.StockPhysique;
import com.alomrane.sigr.model.enums.AlerteType;
import com.alomrane.sigr.repository.AlerteStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlerteService {

    private final AlerteStockRepository alerteStockRepository;

    @Transactional(readOnly = true)
    public List<AlerteResponse> getAlertes(String search, String type, Boolean traitee, Boolean ignoree) {
        Specification<AlerteStock> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("message")), pattern),
                        cb.like(cb.lower(root.get("produit").get("designation")), pattern),
                        cb.like(cb.lower(root.get("produit").get("codeArticle")), pattern)
                ));
            }
            if (type != null && !type.isEmpty()) {
                predicates.add(cb.equal(root.get("type"), AlerteType.valueOf(type)));
            }
            if (traitee != null) {
                predicates.add(cb.equal(root.get("traitee"), traitee));
            }
            if (ignoree != null) {
                predicates.add(cb.equal(root.get("ignoree"), ignoree));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<AlerteStock> alertes = alerteStockRepository.findAll(spec);
        return alertes.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public AlerteResponse marquerTraitee(Long id) {
        AlerteStock alerte = alerteStockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alerte introuvable"));
        alerte.setTraitee(true);
        alerte.setIgnoree(false);
        return toResponse(alerteStockRepository.save(alerte));
    }

    @Transactional
    public AlerteResponse marquerIgnoree(Long id) {
        AlerteStock alerte = alerteStockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alerte introuvable"));
        alerte.setIgnoree(true);
        alerte.setTraitee(false);
        return toResponse(alerteStockRepository.save(alerte));
    }

    @Transactional
    public AlerteResponse reactiver(Long id) {
        AlerteStock alerte = alerteStockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alerte introuvable"));
        alerte.setTraitee(false);
        alerte.setIgnoree(false);
        return toResponse(alerteStockRepository.save(alerte));
    }

    private AlerteResponse toResponse(AlerteStock a) {
        Produit p = a.getProduit();
        StockPhysique stock = p.getStockPhysique();
        int stockDispo = (stock != null && stock.getQuantiteTheorique() != null)
                ? stock.getQuantiteTheorique().intValue()
                : 0;
        return AlerteResponse.builder()
                .id(a.getId())
                .type(a.getType().name())
                .message(a.getMessage())
                .dateCreation(a.getDateCreation())
                .traitee(a.isTraitee())
                .ignoree(a.isIgnoree())
                .produitId(p.getId())
                .produitCode(p.getCodeArticle())
                .produitDesignation(p.getDesignation())
                .stockDisponible(stockDispo)
                .uniteMesure(p.getUniteMesure())
                .build();
    }
}