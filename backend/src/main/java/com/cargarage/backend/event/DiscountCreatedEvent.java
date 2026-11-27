package com.cargarage.backend.event;

// Published when an admin creates a discount. It carries only the id: the listener runs later,
// on another thread and in its own transaction, so it loads fresh data itself.
public record DiscountCreatedEvent(Long discountId) {
}