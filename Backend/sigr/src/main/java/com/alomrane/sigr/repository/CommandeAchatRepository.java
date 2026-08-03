package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.CommandeAchat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CommandeAchatRepository extends JpaRepository<CommandeAchat, Long>, JpaSpecificationExecutor<CommandeAchat> {
    // Pour la génération de référence
    long countByReferenceStartingWith(String prefix);
}