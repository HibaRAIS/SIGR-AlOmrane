package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.response.BonSortieResponse;
import com.alomrane.sigr.model.*;
import com.alomrane.sigr.model.enums.StatutDemande;
import com.alomrane.sigr.model.enums.StatutSortie;
import com.alomrane.sigr.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SortieService {

    private final DemandeInterneRepository demandeRepo;
    private final BonSortieRepository bonSortieRepo;
    private final LigneSortieRepository ligneSortieRepo;
    private final StockPhysiqueRepository stockRepo;

    /**
     * Prépare une sortie (bon de sortie) pour une demande validée.
     * @return DTO BonSortieResponse sans proxies Hibernate
     */
    public BonSortieResponse preparerSortie(Long demandeId, Utilisateur responsable) {
        DemandeInterne demande = demandeRepo.findById(demandeId)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));
        if (demande.getStatut() != StatutDemande.VALIDEE) {
            throw new RuntimeException("La demande n'est pas validée");
        }

        BonSortie bon = BonSortie.builder()
                .dateSortie(LocalDateTime.now())
                .statut(StatutSortie.EN_PREPARATION)
                .demande(demande)
                .utilisateur(responsable)
                .build();
        bon = bonSortieRepo.save(bon);

        for (LigneDemande ligne : demande.getLignes()) {
            LigneSortie ls = LigneSortie.builder()
                    .bonSortie(bon)
                    .produit(ligne.getProduit())
                    .quantiteSortie(ligne.getQuantiteAccordee())
                    .build();
            ligneSortieRepo.save(ls);
        }

        demande.lancerPreparation();
        demandeRepo.save(demande);

        return toBonSortieResponse(bon);
    }

    /**
     * Livre une sortie (valide le bon de sortie).
     * @return DTO BonSortieResponse sans proxies Hibernate
     */
    public BonSortieResponse livrerSortie(Long bonId, String signature) {
        BonSortie bon = bonSortieRepo.findById(bonId)
                .orElseThrow(() -> new RuntimeException("Bon introuvable"));
        if (bon.getStatut() != StatutSortie.EN_PREPARATION) {
            throw new RuntimeException("Le bon n'est pas en préparation");
        }

        DemandeInterne demande = bon.getDemande();
        for (LigneSortie ls : bon.getLignes()) {
            StockPhysique stock = ls.getProduit().getStockPhysique();
            if (stock == null) {
                log.error("Stock physique manquant pour le produit {}", ls.getProduit().getId());
                throw new RuntimeException("Stock physique introuvable pour le produit " + ls.getProduit().getDesignation());
            }
            stock.setQuantiteTheorique(stock.getQuantiteTheorique().subtract(ls.getQuantiteSortie()));
            stock.setQuantiteReservee(stock.getQuantiteReservee().subtract(ls.getQuantiteSortie()));
            stock.setCumulSortie(stock.getCumulSortie().add(ls.getQuantiteSortie()));
            stock.setDateDerniereSortie(LocalDateTime.now().toLocalDate());
            stockRepo.save(stock);
        }

        bon.setStatut(StatutSortie.VALIDE);
        bon.setNomReceptionnaire(signature);
        demande.marquerLivree();
        demandeRepo.save(demande);
        bonSortieRepo.save(bon);

        return toBonSortieResponse(bon);
    }

    /**
     * Convertit l'entité BonSortie en DTO sans relations cycliques.
     */
    private BonSortieResponse toBonSortieResponse(BonSortie bon) {
        return new BonSortieResponse(
                bon.getId(),
                bon.getDateSortie(),
                bon.getStatut().name(),
                bon.getNomReceptionnaire(),
                bon.getDemande().getId(),
                bon.getDemande().getNumeroDemande()
        );
    }
}