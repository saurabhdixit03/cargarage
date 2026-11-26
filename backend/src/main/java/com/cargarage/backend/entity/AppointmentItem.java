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

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "appointment_items",
        uniqueConstraints = @UniqueConstraint(name = "uk_appointment_items_appointment_service",
                columnNames = {"appointment_id", "service_id"})
)
public class AppointmentItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_appointment_items_appointment"))
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_appointment_items_service"))
    private GarageService service;

    // Service price at booking time. If the garage changes prices later, old bookings stay correct.
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
}