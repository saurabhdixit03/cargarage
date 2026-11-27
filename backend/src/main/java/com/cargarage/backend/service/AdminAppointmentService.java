package com.cargarage.backend.service;

import com.cargarage.backend.dto.response.AdminAppointmentResponse;
import com.cargarage.backend.entity.Appointment;
import com.cargarage.backend.entity.Customer;
import com.cargarage.backend.entity.enums.AppointmentStatus;
import com.cargarage.backend.entity.enums.CustomerType;
import com.cargarage.backend.exception.BusinessRuleException;
import com.cargarage.backend.exception.ResourceNotFoundException;
import com.cargarage.backend.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

// The admin's side of appointments. Kept apart from AppointmentService, which serves customers.
@Service
@RequiredArgsConstructor
public class AdminAppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final Clock clock;

    // No status means every booking. Oldest date first, so the next jobs are on top.
    @Transactional(readOnly = true)
    public List<AdminAppointmentResponse> list(AppointmentStatus status) {
        List<Appointment> appointments = (status == null)
                ? appointmentRepository.findAll(Sort.by("appointmentDate"))
                : appointmentRepository.findByStatusOrderByAppointmentDateAsc(status);
        return appointments.stream().map(AdminAppointmentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AdminAppointmentResponse get(Long appointmentId) {
        return AdminAppointmentResponse.from(appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> notFound(appointmentId)));
    }

    // PENDING -> ACCEPTED
    @Transactional
    public AdminAppointmentResponse accept(Long appointmentId) {
        Appointment appointment = findForUpdate(appointmentId);
        requireStatus(appointment, AppointmentStatus.PENDING, "accepted");
        if (appointment.getAppointmentDate().isBefore(LocalDate.now(clock))) {
            throw new BusinessRuleException("This booking's date has already passed");
        }
        appointment.setStatus(AppointmentStatus.ACCEPTED);
        return AdminAppointmentResponse.from(appointment);
    }

    // PENDING -> REJECTED
    @Transactional
    public AdminAppointmentResponse reject(Long appointmentId) {
        Appointment appointment = findForUpdate(appointmentId);
        requireStatus(appointment, AppointmentStatus.PENDING, "rejected");
        appointment.setStatus(AppointmentStatus.REJECTED);
        return AdminAppointmentResponse.from(appointment);
    }

    // ACCEPTED -> COMPLETED, only on or after the appointment day
    @Transactional
    public AdminAppointmentResponse complete(Long appointmentId) {
        Appointment appointment = findForUpdate(appointmentId);
        requireStatus(appointment, AppointmentStatus.ACCEPTED, "completed");
        if (appointment.getAppointmentDate().isAfter(LocalDate.now(clock))) {
            throw new BusinessRuleException("A booking can't be completed before its appointment day");
        }
        appointment.setStatus(AppointmentStatus.COMPLETED);

        // A customer whose car we have actually serviced becomes a REPEAT customer.
        // Only COMPLETED visits count, so booking and cancelling can't earn repeat-customer discounts.
        Customer customer = appointment.getCustomer();
        if (customer.getCustomerType() == CustomerType.REGULAR) {
            customer.setCustomerType(CustomerType.REPEAT);
        }
        return AdminAppointmentResponse.from(appointment);
    }

    // Locked read: a customer's cancel and the admin's accept on the same booking can't overwrite each other
    private Appointment findForUpdate(Long appointmentId) {
        return appointmentRepository.findLockedById(appointmentId)
                .orElseThrow(() -> notFound(appointmentId));
    }

    private void requireStatus(Appointment appointment, AppointmentStatus required, String action) {
        if (appointment.getStatus() != required) {
            throw new BusinessRuleException("Only " + required.name().toLowerCase() + " bookings can be " + action
                    + " (this one is " + appointment.getStatus().name().toLowerCase() + ")");
        }
    }

    private ResourceNotFoundException notFound(Long appointmentId) {
        return new ResourceNotFoundException("Appointment " + appointmentId + " not found");
    }
}