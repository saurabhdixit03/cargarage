package com.cargarage.backend.exception;

// Thrown when a requested record doesn't exist. Becomes HTTP 404 in step 4.
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}