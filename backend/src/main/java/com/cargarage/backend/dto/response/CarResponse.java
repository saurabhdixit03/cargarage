package com.cargarage.backend.dto.response;

import com.cargarage.backend.entity.Car;

public record CarResponse(
        Long id,
        String make,
        String model,
        String color,
        String licensePlate
) {

    public static CarResponse from(Car car) {
        return new CarResponse(car.getId(), car.getMake(), car.getModel(), car.getColor(), car.getLicensePlate());
    }
}