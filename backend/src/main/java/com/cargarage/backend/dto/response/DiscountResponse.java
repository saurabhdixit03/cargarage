package com.cargarage.backend.dto.response;

import com.cargarage.backend.entity.Discount;
import com.cargarage.backend.entity.GarageService;
import com.cargarage.backend.entity.enums.CustomerType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

public record DiscountResponse(
        Long id,
        String name,
        String description,
        BigDecimal percentage,
        LocalDate validUntil,
        CustomerType targetCustomerType,
        boolean active,
        List<ServiceSummary> services
) {

    // Just enough to show which services the offer covers
    public record ServiceSummary(Long id, String name) {
    }

    public static DiscountResponse from(Discount discount) {
        return new DiscountResponse(
                discount.getId(),
                discount.getName(),
                discount.getDescription(),
                discount.getPercentage(),
                discount.getValidUntil(),
                discount.getTargetCustomerType(),
                discount.isActive(),
                discount.getServices().stream()
                        .sorted(Comparator.comparing(GarageService::getName))
                        .map(service -> new ServiceSummary(service.getId(), service.getName()))
                        .toList());
    }
}