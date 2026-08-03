package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.JournalMouvement;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface JournalMouvementRepository extends JpaRepository<JournalMouvement, Long> {

    @Query("SELECT j FROM JournalMouvement j JOIN j.lignes l WHERE l.produit.id = :produitId ORDER BY j.dateMouvement DESC")
    List<JournalMouvement> findByProduitId(@Param("produitId") Long produitId);

    @Query("SELECT COUNT(j) > 0 FROM JournalMouvement j JOIN j.lignes l WHERE l.produit.id = :produitId AND j.type IN ('ENTREE','SORTIE')")
    boolean existsMouvementsReelsByProduitId(@Param("produitId") Long produitId);

    @Query("SELECT COUNT(j) FROM JournalMouvement j WHERE j.dateMouvement BETWEEN :debut AND :fin")
    long countByDateMouvementBetween(@Param("debut") LocalDateTime debut, @Param("fin") LocalDateTime fin);

    @Query("SELECT j.codeUnique FROM JournalMouvement j WHERE j.codeUnique LIKE :prefix% ORDER BY j.codeUnique DESC")
    List<String> findTopCodeUniqueByPrefix(@Param("prefix") String prefix, Pageable pageable);

    Optional<JournalMouvement> findTopByOrderByDateMouvementDescIdDesc();

    List<JournalMouvement> findAllByOrderByDateMouvementAscIdAsc();

    @Modifying
    @Query("UPDATE JournalMouvement j SET j.hashChaine = :hash, j.previousHash = :previousHash WHERE j.id = :id")
    void updateHashChaineAndPreviousHash(@Param("id") Long id,
                                         @Param("hash") String hash,
                                         @Param("previousHash") String previousHash);

    // Méthode native pour récupérer le dernier hash (utilisé uniquement au démarrage)
    @Query(value = "SELECT j.hash_chaine FROM journal_mouvements j ORDER BY j.date_mouvement DESC, j.id DESC LIMIT 1", nativeQuery = true)
    Optional<String> findLastHashChaine();
}