package com.cargarage.backend.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record RescheduleRequest(

        @NotNull(message = "Appointment date is required")
        @Future(message = "Appointment date must be from tomorrow onwards")
        LocalDate appointmentDate
) {
}