package com.cargarage.backend.service;

import com.cargarage.backend.dto.request.LoginRequest;
import com.cargarage.backend.dto.request.RegisterRequest;
import com.cargarage.backend.dto.response.AuthResponse;
import com.cargarage.backend.entity.Customer;
import com.cargarage.backend.exception.DuplicateResourceException;
import com.cargarage.backend.exception.InvalidCredentialsException;
import com.cargarage.backend.repository.AdminRepository;
import com.cargarage.backend.repository.CustomerRepository;
import com.cargarage.backend.security.Role;
import com.cargarage.backend.security.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CustomerRepository customerRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    @Transactional
    public AuthResponse registerCustomer(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (customerRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        Customer customer = new Customer();
        customer.setName(request.name().trim());
        customer.setEmail(email);
        customer.setMobile(request.mobile());
        // Store only the BCrypt hash, never the password itself
        customer.setPassword(passwordEncoder.encode(request.password()));

        Customer saved = customerRepository.save(customer);
        return buildResponse(saved.getId(), saved.getEmail(), saved.getName(), Role.CUSTOMER);
    }

    @Transactional(readOnly = true)
    public AuthResponse loginCustomer(LoginRequest request) {
        return customerRepository.findByEmail(normalizeEmail(request.email()))
                .filter(customer -> passwordEncoder.matches(request.password(), customer.getPassword()))
                .map(customer -> buildResponse(customer.getId(), customer.getEmail(), customer.getName(), Role.CUSTOMER))
                .orElseThrow(InvalidCredentialsException::new);
    }

    @Transactional(readOnly = true)
    public AuthResponse loginAdmin(LoginRequest request) {
        return adminRepository.findByEmail(normalizeEmail(request.email()))
                .filter(admin -> passwordEncoder.matches(request.password(), admin.getPassword()))
                .map(admin -> buildResponse(admin.getId(), admin.getEmail(), admin.getName(), Role.ADMIN))
                .orElseThrow(InvalidCredentialsException::new);
    }

    private AuthResponse buildResponse(Long userId, String email, String name, Role role) {
        String token = tokenService.createToken(userId, email, role);
        return new AuthResponse(token, "Bearer", tokenService.getExpiryMinutes(), userId, name, role.name());
    }

    // "  Rahul@Example.COM " and "rahul@example.com" are the same account
    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}