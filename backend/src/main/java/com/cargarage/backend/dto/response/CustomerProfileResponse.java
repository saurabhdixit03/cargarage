package com.cargarage.backend.dto.response;

import com.cargarage.backend.entity.Customer;
import com.cargarage.backend.entity.enums.CustomerType;

import java.time.LocalDate;

// No password field: the hash never leaves the server
public record CustomerProfileResponse(
        Long id,
        String name,
        String email,
        String mobile,
        CustomerType customerType,
        LocalDate memberSince
) {

    public static CustomerProfileResponse from(Customer customer) {
        return new CustomerProfileResponse(
                customer.getId(),
                customer.getName(),
                customer.getEmail(),
                customer.getMobile(),
                customer.getCustomerType(),
                customer.getCreatedAt().toLocalDate());
    }
}