package com.cargarage.backend.repository;

import com.cargarage.backend.entity.FaceliftKit;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FaceliftKitRepository extends JpaRepository<FaceliftKit, Long> {

    // Admin list: every kit with its photo links, in one query
    @Override
    @EntityGraph(attributePaths = "imageUrls")
    List<FaceliftKit> findAll(Sort sort);

    // Active kits, optionally filtered by make and/or model (any letter case).
    // A null parameter means "don't filter on this", so one query covers every combination.
    @EntityGraph(attributePaths = "imageUrls")
    @Query("""
            select k from FaceliftKit k
            where k.active = true
              and (:make is null or lower(k.carMake) = lower(:make))
              and (:model is null or lower(k.carModel) = lower(:model))
            order by k.kitName
            """)
    List<FaceliftKit> findActive(@Param("make") String make, @Param("model") String model);
}