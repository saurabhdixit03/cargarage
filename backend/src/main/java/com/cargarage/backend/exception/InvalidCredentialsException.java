package com.cargarage.backend.exception;

// Thrown when the email or password is wrong. Becomes HTTP 401.
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        // Same message whether the email or the password was wrong,
        // so attackers can't find out which emails have accounts
        super("Invalid email or password");
    }
}