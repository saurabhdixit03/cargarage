package com.cargarage.backend.repository;

import com.cargarage.backend.entity.Discount;
import com.cargarage.backend.entity.enums.CustomerType;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface DiscountRepository extends JpaRepository<Discount, Long> {

    // Admin list: every discount with its services, in one query
    @Override
    @EntityGraph(attributePaths = "services")
    List<Discount> findAll(Sort sort);

    // Offers a customer can use today: switched on, not expired, meant for their type. Biggest discount first.
    // As a derived method name this would be very long, so it's written as a JPQL query instead.
    @EntityGraph(attributePaths = "services")
    @Query("""
            select d from Discount d
            where d.active = true
              and d.validUntil >= :today
              and d.targetCustomerType = :type
            order by d.percentage desc
            """)
    List<Discount> findAvailable(@Param("today") LocalDate today, @Param("type") CustomerType type);
}