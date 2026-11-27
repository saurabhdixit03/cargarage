package com.cargarage.backend.controller;

import com.cargarage.backend.dto.request.UpdateProfileRequest;
import com.cargarage.backend.dto.response.CustomerProfileResponse;
import com.cargarage.backend.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers/me")
@RequiredArgsConstructor
public class CustomerProfileController {

    private final CustomerService customerService;

    @GetMapping
    public CustomerProfileResponse getProfile(@AuthenticationPrincipal Jwt jwt) {
        return customerService.getProfile(customerId(jwt));
    }

    @PutMapping
    public CustomerProfileResponse updateProfile(@AuthenticationPrincipal Jwt jwt,
                                                 @Valid @RequestBody UpdateProfileRequest request) {
        return customerService.updateProfile(customerId(jwt), request);
    }

    private Long customerId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}