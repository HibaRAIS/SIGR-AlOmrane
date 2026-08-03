package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProduitRepository extends JpaRepository<Produit, Long>, JpaSpecificationExecutor<Produit> {
    List<Produit> findByDesignationContainingIgnoreCase(String search);
    @Query("SELECT p FROM Produit p LEFT JOIN FETCH p.categorie")
    List<Produit> findAllWithCategorie();
    @Query("SELECT DISTINCT p FROM Produit p LEFT JOIN FETCH p.categorie LEFT JOIN FETCH p.ficheTechnique")
    List<Produit> findAllWithCategorieAndFicheTechnique();
    Optional<Produit> findByCodeArticle(String codeArticle);
    long countByCodeArticleStartingWith(String prefix);


    //chat
    long count();

}

