package com.cargarage.backend.repository;

import com.cargarage.backend.entity.Discount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DiscountRepository extends JpaRepository<Discount, Long> {

    // Offers customers can see today: switched on and not expired
    List<Discount> findByActiveTrueAndValidUntilGreaterThanEqual(LocalDate date);
}