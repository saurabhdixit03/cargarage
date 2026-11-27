package com.cargarage.backend.dto.response;

import com.cargarage.backend.entity.GarageService;

import java.math.BigDecimal;

// Data the API sends back. Never the entity itself.
public record GarageServiceResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        boolean active
) {

    // Converts an entity into this response
    public static GarageServiceResponse from(GarageService service) {
        return new GarageServiceResponse(
                service.getId(),
                service.getName(),
                service.getDescription(),
                service.getPrice(),
                service.isActive()
        );
    }
}