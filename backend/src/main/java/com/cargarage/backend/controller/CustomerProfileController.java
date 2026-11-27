package com.cargarage.backend.controller;

import com.cargarage.backend.dto.request.ChangePasswordRequest;
import com.cargarage.backend.dto.request.UpdateProfileRequest;
import com.cargarage.backend.dto.response.CustomerProfileResponse;
import com.cargarage.backend.security.CurrentUserId;
import com.cargarage.backend.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers/me")
@RequiredArgsConstructor
public class CustomerProfileController {

    private final CustomerService customerService;

    @GetMapping
    public CustomerProfileResponse getProfile(@CurrentUserId Long customerId) {
        return customerService.getProfile(customerId);
    }

    @PutMapping
    public CustomerProfileResponse updateProfile(@CurrentUserId Long customerId,
                                                 @Valid @RequestBody UpdateProfileRequest request) {
        return customerService.updateProfile(customerId, request);
    }

    // POST, not PUT: sending the same request twice fails the second time (the current password has changed),
    // so it isn't idempotent the way a PUT should be
    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@CurrentUserId Long customerId,
                               @Valid @RequestBody ChangePasswordRequest request) {
        customerService.changePassword(customerId, request);
    }
}