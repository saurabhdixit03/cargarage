package com.cargarage.backend.security;

// Who the token belongs to. Stored in the token's "role" claim.
public enum Role {
    ADMIN,
    CUSTOMER
}