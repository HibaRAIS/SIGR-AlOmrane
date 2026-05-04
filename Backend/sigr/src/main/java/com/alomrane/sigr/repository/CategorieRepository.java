package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.Categorie;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// repository/CategorieRepository.java
public interface CategorieRepository extends JpaRepository<Categorie, Long> {
    List<Categorie> findByParentIsNull();

}