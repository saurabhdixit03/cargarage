package com.cargarage.backend.controller;

import com.cargarage.backend.dto.request.LoginRequest;
import com.cargarage.backend.dto.request.RegisterRequest;
import com.cargarage.backend.dto.response.AuthResponse;
import com.cargarage.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// Public endpoints (no token needed): SecurityConfig permits /api/auth/**
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/customers/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerCustomer(@Valid @RequestBody RegisterRequest request) {
        return authService.registerCustomer(request);
    }

    @PostMapping("/customers/login")
    public AuthResponse loginCustomer(@Valid @RequestBody LoginRequest request) {
        return authService.loginCustomer(request);
    }

    @PostMapping("/admin/login")
    public AuthResponse loginAdmin(@Valid @RequestBody LoginRequest request) {
        return authService.loginAdmin(request);
    }
}