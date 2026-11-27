package com.cargarage.backend.repository;

import com.cargarage.backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    // Login: find the account by email
    Optional<Customer> findByEmail(String email);

    // Registration: is this email already taken?
    boolean existsByEmail(String email);
}