package com.cargarage.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record FaceliftKitRequest(

        @NotBlank(message = "Kit name is required")
        @Size(max = 100, message = "Kit name must be at most 100 characters")
        String kitName,

        @NotBlank(message = "Car make is required")
        @Size(max = 50, message = "Car make must be at most 50 characters")
        String carMake,

        @NotBlank(message = "Car model is required")
        @Size(max = 50, message = "Car model must be at most 50 characters")
        String carModel,

        @NotBlank(message = "Description is required")
        @Size(max = 500, message = "Description must be at most 500 characters")
        String description,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.00", inclusive = false, message = "Price must be more than 0")
        @Digits(integer = 8, fraction = 2, message = "Price can have up to 8 digits and 2 decimal places")
        BigDecimal price,

        // A List, not a Set: the order matters, because the first photo is the one shown on cards
        @NotEmpty(message = "Add at least one photo link")
        @Size(max = 6, message = "A kit can have at most 6 photos")
        List<@NotBlank(message = "Photo link can't be empty")
             @Size(max = 500, message = "Photo link must be at most 500 characters")
             @Pattern(regexp = "^https?://\\S+$", message = "Each photo must be an http or https link")
             String> imageUrls
) {
}