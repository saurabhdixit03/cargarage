package com.cargarage.backend.repository;

import com.cargarage.backend.entity.Car;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;

public interface CarRepository extends JpaRepository<Car, Long> {

    List<Car> findByCustomerId(Long customerId);

    Optional<Car> findByIdAndCustomerId(Long id, Long customerId);

    // Same query as above, but it locks the row (SELECT ... FOR UPDATE) until the transaction ends.
    // "Locked" is only part of the name: Spring Data ignores any words between "find" and "By".
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Car> findLockedByIdAndCustomerId(Long id, Long customerId);

    boolean existsByLicensePlate(String licensePlate);

    boolean existsByLicensePlateAndIdNot(String licensePlate, Long id);
}