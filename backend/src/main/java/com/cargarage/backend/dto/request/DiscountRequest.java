package com.cargarage.backend.dto.request;

import com.cargarage.backend.entity.enums.CustomerType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

public record DiscountRequest(

        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        String name,

        @NotBlank(message = "Description is required")
        @Size(max = 500, message = "Description must be at most 500 characters")
        String description,

        @NotNull(message = "Percentage is required")
        @DecimalMin(value = "1.00", message = "Percentage must be between 1 and 90")
        @DecimalMax(value = "90.00", message = "Percentage must be between 1 and 90")
        @Digits(integer = 2, fraction = 2, message = "Percentage can have at most 2 decimal places")
        BigDecimal percentage,

        @NotNull(message = "Valid-until date is required")
        @FutureOrPresent(message = "Valid-until date can't be in the past")
        LocalDate validUntil,

        @NotNull(message = "Target customer type is required (REGULAR or REPEAT)")
        CustomerType targetCustomerType,

        @NotEmpty(message = "Choose at least one service")
        Set<@NotNull(message = "Service id can't be empty") Long> serviceIds
) {
}