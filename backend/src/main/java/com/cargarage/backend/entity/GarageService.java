package com.cargarage.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "garage_services",
        uniqueConstraints = @UniqueConstraint(name = "uk_garage_services_name", columnNames = "name")
)
public class GarageService extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;            // e.g. Ceramic Coating

    @Column(nullable = false, length = 500)
    private String description;

    // Money is always BigDecimal, never double
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    // The admin hides a service instead of deleting it, because old appointments still point to it
    @Column(nullable = false)
    private boolean active = true;
}