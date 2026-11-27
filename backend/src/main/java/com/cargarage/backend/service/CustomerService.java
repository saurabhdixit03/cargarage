package com.cargarage.backend.service;

import com.cargarage.backend.dto.request.UpdateProfileRequest;
import com.cargarage.backend.dto.response.CustomerProfileResponse;
import com.cargarage.backend.entity.Customer;
import com.cargarage.backend.exception.ResourceNotFoundException;
import com.cargarage.backend.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public CustomerProfileResponse getProfile(Long customerId) {
        return CustomerProfileResponse.from(findCustomer(customerId));
    }

    @Transactional
    public CustomerProfileResponse updateProfile(Long customerId, UpdateProfileRequest request) {
        Customer customer = findCustomer(customerId);
        customer.setName(request.name().trim());
        customer.setMobile(request.mobile());
        // No save() call needed: dirty checking writes the changes when the transaction commits
        return CustomerProfileResponse.from(customer);
    }

    // A valid token for a deleted account would land here
    private Customer findCustomer(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer " + customerId + " not found"));
    }
}