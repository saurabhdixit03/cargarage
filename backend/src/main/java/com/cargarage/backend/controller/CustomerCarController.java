package com.cargarage.backend.controller;

import com.cargarage.backend.dto.request.CarRequest;
import com.cargarage.backend.dto.response.CarResponse;
import com.cargarage.backend.security.CurrentUserId;
import com.cargarage.backend.service.CarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// "me" = the logged-in customer. SecurityConfig only lets CUSTOMER tokens in here.
@RestController
@RequestMapping("/api/customers/me/cars")
@RequiredArgsConstructor
public class CustomerCarController {

    private final CarService carService;

    @GetMapping
    public List<CarResponse> listMyCars(@CurrentUserId Long customerId) {
        return carService.listMyCars(customerId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CarResponse addCar(@CurrentUserId Long customerId, @Valid @RequestBody CarRequest request) {
        return carService.addCar(customerId, request);
    }

    @PutMapping("/{carId}")
    public CarResponse updateCar(@CurrentUserId Long customerId,
                                 @PathVariable Long carId,
                                 @Valid @RequestBody CarRequest request) {
        return carService.updateCar(customerId, carId, request);
    }

    @DeleteMapping("/{carId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCar(@CurrentUserId Long customerId, @PathVariable Long carId) {
        carService.deleteCar(customerId, carId);
    }
}