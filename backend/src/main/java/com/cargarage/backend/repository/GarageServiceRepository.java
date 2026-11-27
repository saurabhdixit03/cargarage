package com.cargarage.backend.repository;

import com.cargarage.backend.entity.GarageService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GarageServiceRepository extends JpaRepository<GarageService, Long> {

    // Services customers can book, sorted A-Z
    List<GarageService> findByActiveTrueOrderByNameAsc();

    boolean existsByName(String name);
}