package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.StockPhysique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StockPhysiqueRepository extends JpaRepository<StockPhysique, Long> {
    @Query("SELECT DISTINCT s.emplacementPrincipal FROM StockPhysique s WHERE s.emplacementPrincipal IS NOT NULL")
    List<String> findDistinctEmplacementPrincipal();




    //chat
    @Query("SELECT COUNT(p) FROM Produit p JOIN p.stockPhysique sp WHERE sp.quantiteTheorique <= :seuil")
    long countBySeuil(@Param("seuil") int seuil);
}