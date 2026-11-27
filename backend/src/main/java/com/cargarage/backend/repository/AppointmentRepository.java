package com.cargarage.backend.repository;

import com.cargarage.backend.entity.Appointment;
import com.cargarage.backend.entity.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // A customer's booking history, newest first
    List<Appointment> findByCustomerIdOrderByAppointmentDateDesc(Long customerId);

    // Ownership check: returns the booking only if it belongs to this customer
    Optional<Appointment> findByIdAndCustomerId(Long id, Long customerId);

    // Double-booking check: does this car already have an active booking on this date?
    boolean existsByCarIdAndAppointmentDateAndStatusIn(
            Long carId, LocalDate appointmentDate, Collection<AppointmentStatus> statuses);

    // Used to mark a customer as REPEAT once they have booked before
    long countByCustomerId(Long customerId);

    // Admin dashboard: e.g. all PENDING bookings, earliest first
    List<Appointment> findByStatusOrderByAppointmentDateAsc(AppointmentStatus status);
}