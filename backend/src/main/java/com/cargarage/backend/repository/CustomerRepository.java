package com.cargarage.backend.repository;

import com.cargarage.backend.entity.Customer;
import com.cargarage.backend.entity.enums.CustomerType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByEmail(String email);

    boolean existsByEmail(String email);

    // Everyone a discount targets. Fine for a garage's customer list; a huge list would be read in pages.
    List<Customer> findByCustomerType(CustomerType customerType);
}