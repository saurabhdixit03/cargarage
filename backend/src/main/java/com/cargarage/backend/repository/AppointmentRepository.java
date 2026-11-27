package com.cargarage.backend.repository;

import com.cargarage.backend.entity.Appointment;
import com.cargarage.backend.entity.enums.AppointmentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByCustomerIdOrderByAppointmentDateDesc(Long customerId);

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

    List<Appointment> findByStatusOrderByAppointmentDateAsc(AppointmentStatus status);
}