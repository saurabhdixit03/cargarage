package com.cargarage.backend.service;

import com.cargarage.backend.dto.request.CarRequest;
import com.cargarage.backend.dto.response.CarResponse;
import com.cargarage.backend.entity.Car;
import com.cargarage.backend.exception.BusinessRuleException;
import com.cargarage.backend.exception.DuplicateResourceException;
import com.cargarage.backend.exception.ResourceNotFoundException;
import com.cargarage.backend.repository.AppointmentRepository;
import com.cargarage.backend.repository.CarRepository;
import com.cargarage.backend.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CarService {

    private final CarRepository carRepository;
    private final CustomerRepository customerRepository;
    private final AppointmentRepository appointmentRepository;

    @Transactional(readOnly = true)
    public List<CarResponse> listMyCars(Long customerId) {
        return carRepository.findByCustomerId(customerId).stream()
                .map(CarResponse::from)
                .toList();
    }

    @Transactional
    public CarResponse addCar(Long customerId, CarRequest request) {
        String plate = normalizePlate(request.licensePlate());
        if (carRepository.existsByLicensePlate(plate)) {
            throw new DuplicateResourceException("A car with plate " + plate + " is already registered");
        }

        Car car = new Car();
        // getReferenceById gives a lightweight stand-in for the customer: no extra SELECT needed,
        // because all we need is the id for the customer_id column
        car.setCustomer(customerRepository.getReferenceById(customerId));
        applyChanges(car, request, plate);

        return CarResponse.from(carRepository.save(car));
    }

    @Transactional
    public CarResponse updateCar(Long customerId, Long carId, CarRequest request) {
        Car car = findMyCar(customerId, carId);

        String plate = normalizePlate(request.licensePlate());
        if (carRepository.existsByLicensePlateAndIdNot(plate, carId)) {
            throw new DuplicateResourceException("A car with plate " + plate + " is already registered");
        }

        applyChanges(car, request, plate);
        return CarResponse.from(car);
    }

    @Transactional
    public void deleteCar(Long customerId, Long carId) {
        Car car = findMyCar(customerId, carId);
        if (appointmentRepository.existsByCarId(carId)) {
            throw new BusinessRuleException("This car has bookings and can't be deleted");
        }
        carRepository.delete(car);
    }

    // Returns the car only if it belongs to this customer.
    // Someone else's car gets the same 404 as a missing one, so nobody learns which ids exist.
    private Car findMyCar(Long customerId, Long carId) {
        return carRepository.findByIdAndCustomerId(carId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Car " + carId + " not found"));
    }

    private void applyChanges(Car car, CarRequest request, String plate) {
        car.setMake(request.make().trim());
        car.setModel(request.model().trim());
        car.setColor(request.color().trim());
        car.setLicensePlate(plate);
    }

    // "mh 12-ab 1234" -> "MH12AB1234"
    private String normalizePlate(String plate) {
        return plate.replaceAll("[\\s-]", "").toUpperCase();
    }
}