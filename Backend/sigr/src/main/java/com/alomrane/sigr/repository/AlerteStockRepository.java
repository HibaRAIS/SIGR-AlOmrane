package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.AlerteStock;
import com.alomrane.sigr.model.enums.AlerteType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlerteStockRepository extends JpaRepository<AlerteStock, Long>, JpaSpecificationExecutor<AlerteStock> {

    boolean existsByProduitIdAndTypeAndTraiteeFalseAndIgnoreeFalse(Long produitId, AlerteType type);

    List<AlerteStock> findByProduitIdAndTraiteeFalseAndIgnoreeFalse(Long produitId);
}