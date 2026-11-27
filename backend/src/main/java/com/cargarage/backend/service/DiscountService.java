package com.cargarage.backend.service;

import com.cargarage.backend.dto.request.DiscountRequest;
import com.cargarage.backend.dto.response.DiscountResponse;
import com.cargarage.backend.entity.Discount;
import com.cargarage.backend.entity.GarageService;
import com.cargarage.backend.entity.enums.CustomerType;
import com.cargarage.backend.exception.FieldValidationException;
import com.cargarage.backend.exception.ResourceNotFoundException;
import com.cargarage.backend.repository.CustomerRepository;
import com.cargarage.backend.repository.DiscountRepository;
import com.cargarage.backend.repository.GarageServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiscountService {

    private final DiscountRepository discountRepository;
    private final GarageServiceRepository garageServiceRepository;
    private final CustomerRepository customerRepository;

    // Admin view: every discount, the ones that run longest first
    @Transactional(readOnly = true)
    public List<DiscountResponse> listAll() {
        return discountRepository.findAll(Sort.by(Sort.Direction.DESC, "validUntil")).stream()
                .map(DiscountResponse::from)
                .toList();
    }

    // The offers this customer can use today. Their type (REGULAR or REPEAT) is read from the database,
    // not from the token, because it changes when a visit is completed.
    @Transactional(readOnly = true)
    public List<DiscountResponse> listForCustomer(Long customerId) {
        CustomerType type = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer " + customerId + " not found"))
                .getCustomerType();
        return discountRepository.findAvailable(LocalDate.now(), type).stream()
                .map(DiscountResponse::from)
                .toList();
    }

    @Transactional
    public DiscountResponse create(DiscountRequest request) {
        Discount discount = new Discount();
        applyChanges(discount, request);
        return DiscountResponse.from(discountRepository.save(discount));
    }

    @Transactional
    public DiscountResponse update(Long discountId, DiscountRequest request) {
        Discount discount = findOrThrow(discountId);
        applyChanges(discount, request);
        return DiscountResponse.from(discount);
    }

    // Soft delete: bookings will remember which discount they used, so discounts are switched off, never deleted
    @Transactional
    public DiscountResponse setActive(Long discountId, boolean active) {
        Discount discount = findOrThrow(discountId);
        discount.setActive(active);
        return DiscountResponse.from(discount);
    }

    private Discount findOrThrow(Long discountId) {
        return discountRepository.findById(discountId)
                .orElseThrow(() -> new ResourceNotFoundException("Discount " + discountId + " not found"));
    }

    private void applyChanges(Discount discount, DiscountRequest request) {
        discount.setName(request.name().trim());
        discount.setDescription(request.description().trim());
        discount.setPercentage(request.percentage().setScale(2, RoundingMode.HALF_UP));
        discount.setValidUntil(request.validUntil());
        discount.setTargetCustomerType(request.targetCustomerType());
        // Replace the set's contents; Hibernate updates the discount_services join table to match
        discount.getServices().clear();
        discount.getServices().addAll(findActiveServices(request.serviceIds()));
    }

    // Hidden and non-existent services get the same message, as in booking
    private Set<GarageService> findActiveServices(Set<Long> serviceIds) {
        List<GarageService> found = garageServiceRepository.findAllById(serviceIds).stream()
                .filter(GarageService::isActive)
                .toList();
        Set<Long> foundIds = found.stream().map(GarageService::getId).collect(Collectors.toSet());

        List<Long> unavailable = serviceIds.stream()
                .filter(id -> !foundIds.contains(id))
                .sorted()
                .toList();
        if (!unavailable.isEmpty()) {
            throw new FieldValidationException("serviceIds", "These services aren't available: " + unavailable);
        }
        return new HashSet<>(found);
    }
}