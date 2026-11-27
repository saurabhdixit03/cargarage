package com.cargarage.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Data a customer sends to add or edit one of their cars
public record CarRequest(

        @NotBlank(message = "Make is required")
        @Size(max = 50, message = "Make must be at most 50 characters")
        String make,

        @NotBlank(message = "Model is required")
        @Size(max = 50, message = "Model must be at most 50 characters")
        String model,

        @NotBlank(message = "Color is required")
        @Size(max = 30, message = "Color must be at most 30 characters")
        String color,

        // Indian format, e.g. MH12AB1234. Spaces, dashes and lowercase are accepted; the service cleans them up.
        @NotBlank(message = "License plate is required")
        @Pattern(regexp = "(?i)^[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{0,3}[ -]?[0-9]{4}$",
                message = "License plate must look like MH12AB1234")
        String licensePlate
) {
}