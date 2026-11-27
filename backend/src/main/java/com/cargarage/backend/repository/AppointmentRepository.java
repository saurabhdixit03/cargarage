package com.cargarage.backend.repository;

import com.cargarage.backend.entity.Appointment;
import com.cargarage.backend.entity.enums.AppointmentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // List queries use @EntityGraph: the car, the items and each item's service are loaded in the SAME query.
    // Without it, every appointment in the list triggers extra queries (the N+1 problem).
    @EntityGraph(attributePaths = {"car", "discount", "items", "items.service"})
    List<Appointment> findByCustomerIdOrderByAppointmentDateDesc(Long customerId);

    @EntityGraph(attributePaths = {"customer", "car", "discount", "items", "items.service"})
    List<Appointment> findByStatusOrderByAppointmentDateAsc(AppointmentStatus status);

    // The admin's "all bookings" list. JpaRepository already has this method; it's redeclared here to add the graph.
    @Override
    @EntityGraph(attributePaths = {"customer", "car", "discount", "items", "items.service"})
    List<Appointment> findAll(Sort sort);

    Optional<Appointment> findByIdAndCustomerId(Long id, Long customerId);

    // For changes: locks the booking row (SELECT ... FOR UPDATE) until the transaction ends
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Appointment> findLockedByIdAndCustomerId(Long id, Long customerId);

    // For admin actions: the admin may open any booking, so there's no customer filter
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Appointment> findLockedById(Long id);

    boolean existsByCarIdAndAppointmentDateAndStatusIn(Long carId, LocalDate appointmentDate,
                                                       Collection<AppointmentStatus> statuses);

    // Same check, but ignores one booking: the one being rescheduled
    boolean existsByCarIdAndAppointmentDateAndStatusInAndIdNot(Long carId, LocalDate appointmentDate,
                                                                Collection<AppointmentStatus> statuses, Long id);

    boolean existsByCarId(Long carId);

    long countByCustomerId(Long customerId);
}