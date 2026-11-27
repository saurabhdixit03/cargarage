package com.cargarage.backend.repository;

import com.cargarage.backend.entity.Car;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CarRepository extends JpaRepository<Car, Long> {

    // "My cars" for a customer
    List<Car> findByCustomerId(Long customerId);

    // Ownership check: returns the car only if it belongs to this customer
    Optional<Car> findByIdAndCustomerId(Long id, Long customerId);

    boolean existsByLicensePlate(String licensePlate);

    // On update: is this plate used by a DIFFERENT car?
    boolean existsByLicensePlateAndIdNot(String licensePlate, Long id);
}