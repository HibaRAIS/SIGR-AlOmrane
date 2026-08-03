package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.Tva;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TvaRepository extends JpaRepository<Tva, Long> {
    Optional<Tva> findByCode(String code);
}