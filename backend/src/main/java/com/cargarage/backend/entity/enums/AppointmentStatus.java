package com.cargarage.backend.entity.enums;

public enum AppointmentStatus {
    PENDING,     // booked by the customer, waiting for the garage
    ACCEPTED,    // garage confirmed it
    REJECTED,    // garage declined it
    CANCELLED,   // cancelled by the customer or the garage
    COMPLETED    // work finished
}