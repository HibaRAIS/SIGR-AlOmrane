package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProduitRepository extends JpaRepository<Produit, Long> {
    List<Produit> findByDesignationContainingIgnoreCase(String search);
}