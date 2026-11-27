package com.cargarage.backend.controller;

import com.cargarage.backend.dto.request.BookAppointmentRequest;
import com.cargarage.backend.dto.request.RescheduleRequest;
import com.cargarage.backend.dto.response.AppointmentResponse;
import com.cargarage.backend.security.CurrentUserId;
import com.cargarage.backend.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/customers/me/appointments")
@RequiredArgsConstructor
public class CustomerAppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse book(@CurrentUserId Long customerId,
                                    @Valid @RequestBody BookAppointmentRequest request) {
        return appointmentService.book(customerId, request);
    }

    @GetMapping
    public List<AppointmentResponse> listMyAppointments(@CurrentUserId Long customerId) {
        return appointmentService.listMyAppointments(customerId);
    }

    @GetMapping("/{appointmentId}")
    public AppointmentResponse getMyAppointment(@CurrentUserId Long customerId,
                                                @PathVariable Long appointmentId) {
        return appointmentService.getMyAppointment(customerId, appointmentId);
    }

    // Action endpoints: the client asks for an action, and the server decides the new status.
    // A client can never just send "status": "COMPLETED".
    @PostMapping("/{appointmentId}/reschedule")
    public AppointmentResponse reschedule(@CurrentUserId Long customerId,
                                          @PathVariable Long appointmentId,
                                          @Valid @RequestBody RescheduleRequest request) {
        return appointmentService.reschedule(customerId, appointmentId, request);
    }

    @PostMapping("/{appointmentId}/cancel")
    public AppointmentResponse cancel(@CurrentUserId Long customerId, @PathVariable Long appointmentId) {
        return appointmentService.cancel(customerId, appointmentId);
    }
}