package com.cargarage.backend.dto.response;

import com.cargarage.backend.entity.FaceliftKit;

import java.math.BigDecimal;
import java.util.List;

public record FaceliftKitResponse(
        Long id,
        String kitName,
        String carMake,
        String carModel,
        String description,
        BigDecimal price,
        boolean active,
        List<String> imageUrls
) {

    public static FaceliftKitResponse from(FaceliftKit kit) {
        return new FaceliftKitResponse(
                kit.getId(),
                kit.getKitName(),
                kit.getCarMake(),
                kit.getCarModel(),
                kit.getDescription(),
                kit.getPrice(),
                kit.isActive(),
                // A plain copy, so the response doesn't hold on to Hibernate's own list object
                List.copyOf(kit.getImageUrls()));
    }
}