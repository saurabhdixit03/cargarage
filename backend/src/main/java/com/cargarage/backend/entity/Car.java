package com.cargarage.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "cars",
        uniqueConstraints = @UniqueConstraint(name = "uk_cars_license_plate", columnNames = "license_plate")
)
public class Car extends BaseEntity {

    @Column(nullable = false, length = 50)
    private String make;            // e.g. Hyundai

    @Column(nullable = false, length = 50)
    private String model;           // e.g. Creta

    @Column(nullable = false, length = 30)
    private String color;

    // e.g. MH12AB1234, saved in uppercase without spaces
    @Column(name = "license_plate", nullable = false, length = 15)
    private String licensePlate;

    // Many cars belong to one customer. The foreign key lives here, on the "many" side.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_cars_customer"))
    private Customer customer;
}