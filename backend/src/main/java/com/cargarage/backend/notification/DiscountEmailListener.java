package com.cargarage.backend.notification;

import com.cargarage.backend.entity.Customer;
import com.cargarage.backend.entity.Discount;
import com.cargarage.backend.entity.GarageService;
import com.cargarage.backend.event.DiscountCreatedEvent;
import com.cargarage.backend.repository.CustomerRepository;
import com.cargarage.backend.repository.DiscountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class DiscountEmailListener {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("d MMM yyyy");

    private final DiscountRepository discountRepository;
    private final CustomerRepository customerRepository;
    private final EmailSender emailSender;

    // AFTER_COMMIT: runs only once the discount is really saved. If the save rolls back, no email goes out.
    // @Async: runs on a background thread, so the admin's request doesn't wait for the emails.
    // REQUIRES_NEW: the background thread has no transaction, so it opens its own read-only one
    // to load the discount and the customers.
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void onDiscountCreated(DiscountCreatedEvent event) {
        Discount discount = discountRepository.findById(event.discountId()).orElse(null);
        if (discount == null || !discount.isActive()) {
            return;
        }

        String percent = discount.getPercentage().stripTrailingZeros().toPlainString();
        String subject = "New offer for you: " + discount.getName() + " (" + percent + "% off)";
        String services = discount.getServices().stream()
                .map(GarageService::getName)
                .sorted()
                .collect(Collectors.joining(", "));

        List<Customer> customers = customerRepository.findByCustomerType(discount.getTargetCustomerType());
        int sent = 0;
        for (Customer customer : customers) {
            String body = "Hi " + customer.getName() + ", " + discount.getDescription()
                    + ". Covers: " + services
                    + ". Valid until " + discount.getValidUntil().format(DATE_FORMAT) + ".";
            // One failed email must not stop the rest
            try {
                emailSender.send(customer.getEmail(), subject, body);
                sent++;
            } catch (Exception e) {
                log.warn("Couldn't email {} about discount {}: {}", customer.getEmail(), discount.getId(), e.getMessage());
            }
        }
        log.info("Discount '{}' announced to {} of {} {} customers",
                discount.getName(), sent, customers.size(), discount.getTargetCustomerType());
    }
}