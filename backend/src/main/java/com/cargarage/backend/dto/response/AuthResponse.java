package com.cargarage.backend.dto.response;

// What a successful login or registration returns. The client keeps the token and sends it with every request.
public record AuthResponse(
        String token,
        String tokenType,
        long expiresInMinutes,
        Long userId,
        String name,
        String role
) {
}