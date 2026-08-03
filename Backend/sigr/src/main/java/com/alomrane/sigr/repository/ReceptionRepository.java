package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.Reception;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReceptionRepository extends JpaRepository<Reception, Long>, JpaSpecificationExecutor<Reception> {
    long countByNumeroStartingWith(String prefix);
    List<Reception> findByCommandeId(Long commandeId);
}