package com.cargarage.backend.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;

public record BookAppointmentRequest(

        @NotNull(message = "Car is required")
        Long carId,

        @NotNull(message = "Appointment date is required")
        @Future(message = "Appointment date must be from tomorrow onwards")
        LocalDate appointmentDate,

        // A Set, so the same service sent twice is booked only once
        @NotEmpty(message = "Choose at least one service")
        @Size(max = 10, message = "You can book at most 10 services at once")
        Set<@NotNull(message = "Service id can't be empty") Long> serviceIds
) {
}