package com.alomrane.sigr.repository;

import com.alomrane.sigr.model.Employe;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EmployeRepository extends JpaRepository<Employe, Long> {
    List<Employe> findByManager_Id(Long managerId);

}