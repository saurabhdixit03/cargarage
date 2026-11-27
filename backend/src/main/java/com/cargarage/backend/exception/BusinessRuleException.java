package com.cargarage.backend.exception;

// Thrown when a request breaks a business rule, e.g. deleting a car that has bookings. Becomes HTTP 409.
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }
}