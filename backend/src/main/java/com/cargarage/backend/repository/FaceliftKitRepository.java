package com.cargarage.backend.repository;

import com.cargarage.backend.entity.FaceliftKit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaceliftKitRepository extends JpaRepository<FaceliftKit, Long> {

    List<FaceliftKit> findByActiveTrueOrderByKitNameAsc();

    // Kits that fit a customer's car, e.g. ("Hyundai", "Creta")
    List<FaceliftKit> findByCarMakeIgnoreCaseAndCarModelIgnoreCaseAndActiveTrue(String carMake, String carModel);
}