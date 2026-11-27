package com.cargarage.backend.service;

import com.cargarage.backend.dto.request.DiscountRequest;
import com.cargarage.backend.dto.response.DiscountResponse;
import com.cargarage.backend.entity.AppointmentItem;
import com.cargarage.backend.entity.Discount;
import com.cargarage.backend.entity.GarageService;
import com.cargarage.backend.entity.enums.CustomerType;
import com.cargarage.backend.event.DiscountCreatedEvent;
import com.cargarage.backend.exception.FieldValidationException;
import com.cargarage.backend.exception.ResourceNotFoundException;
import com.cargarage.backend.repository.CustomerRepository;
import com.cargarage.backend.repository.DiscountRepository;
import com.cargarage.backend.repository.GarageServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiscountService {

    private final DiscountRepository discountRepository;
    private final GarageServiceRepository garageServiceRepository;
    private final CustomerRepository customerRepository;
    private final ApplicationEventPublisher eventPublisher;

    // A discount chosen for a booking, and how much money it takes off
    public record AppliedDiscount(Discount discount, BigDecimal amount) {
    }

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

    // The offer that saves the most money on these items, if any applies.
    // Called from inside the booking's transaction, so it needs no @Transactional of its own.
    public Optional<AppliedDiscount> findBestDiscount(CustomerType customerType, List<AppointmentItem> items) {
        return discountRepository.findAvailable(LocalDate.now(), customerType).stream()
                .map(discount -> new AppliedDiscount(discount, savingFor(discount, items)))
                .filter(applied -> applied.amount().signum() > 0)
                .max(Comparator.comparing(AppliedDiscount::amount));
    }

    // Only the services the discount covers are reduced.
    // E.g. 20% off Ceramic Coating (15000.00) saves 3000.00; Interior Deep Cleaning in the same booking stays full price.
    static BigDecimal savingFor(Discount discount, List<AppointmentItem> items) {
        // Compared by id: our entities don't override equals(), so comparing ids is the safe way
        Set<Long> coveredServiceIds = discount.getServices().stream()
                .map(GarageService::getId)
                .collect(Collectors.toSet());

        BigDecimal coveredTotal = items.stream()
                .filter(item -> coveredServiceIds.contains(item.getService().getId()))
                .map(AppointmentItem::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Money is rounded to 2 decimal places, half up (e.g. 2.345 -> 2.35)
        return coveredTotal.multiply(discount.getPercentage())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    @Transactional
    public DiscountResponse create(DiscountRequest request) {
        Discount discount = new Discount();
        applyChanges(discount, request);
        Discount saved = discountRepository.save(discount);
        // Emails go out only after this transaction commits, on a background thread (see DiscountEmailListener)
        eventPublisher.publishEvent(new DiscountCreatedEvent(saved.getId()));
        return DiscountResponse.from(saved);
    }

    @Transactional
    public DiscountResponse update(Long discountId, DiscountRequest request) {
        Discount discount = findOrThrow(discountId);
        applyChanges(discount, request);
        return DiscountResponse.from(discount);
    }

    // Soft delete: bookings remember which discount they used, so discounts are switched off, never deleted
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