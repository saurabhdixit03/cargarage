package com.cargarage.backend.exception;

import lombok.Getter;

// A problem with one input field that @Valid can't detect by itself, e.g. "current password is incorrect".
// It's returned in the same shape as normal validation errors, so the frontend can show it under that field.
@Getter
public class FieldValidationException extends RuntimeException {

    private final String field;

    public FieldValidationException(String field, String message) {
        super(message);
        this.field = field;
    }
}