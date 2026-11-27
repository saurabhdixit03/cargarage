package com.cargarage.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

// Data the admin sends to create or update a service
public record GarageServiceRequest(

        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        String name,

        @NotBlank(message = "Description is required")
        @Size(max = 500, message = "Description must be at most 500 characters")
        String description,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.00", inclusive = false, message = "Price must be greater than 0")
        @Digits(integer = 8, fraction = 2, message = "Price can have at most 8 digits and 2 decimal places")
        BigDecimal price
) {
}