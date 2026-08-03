package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.Categorie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// repository/CategorieRepository.java
public interface CategorieRepository extends JpaRepository<Categorie, Long> {
    List<Categorie> findByParentIsNull();

    // Compte les produits pour chaque catégorie
    @Query("SELECT c.id, COUNT(p) FROM Categorie c LEFT JOIN c.produits p GROUP BY c.id")
    List<Object[]> countProduitsParCategorie();

    //méthode de recherche de catégorie par chemin
    @Query("SELECT c FROM Categorie c WHERE c.nom = :nom")
    Optional<Categorie> findByNom(@Param("nom") String nom);

}