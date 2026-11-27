package com.cargarage.backend.exception;

// Thrown when something unique already exists (e.g. a service name). Becomes HTTP 409 in step 4.
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}