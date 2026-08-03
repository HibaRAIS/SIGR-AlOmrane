package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.Reliquat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReliquatRepository extends JpaRepository<Reliquat, String> {
    List<Reliquat> findByCommandeId(Long commandeId);
    long countByIdStartingWith(String prefix);
    List<Reliquat> findByStatutNot(com.alomrane.sigr.model.enums.StatutReliquat statut);
}