package com.cargarage.backend.controller;

import com.cargarage.backend.dto.request.BookAppointmentRequest;
import com.cargarage.backend.dto.request.RescheduleRequest;
import com.cargarage.backend.dto.response.AppointmentResponse;
import com.cargarage.backend.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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
    public AppointmentResponse book(@AuthenticationPrincipal Jwt jwt,
                                    @Valid @RequestBody BookAppointmentRequest request) {
        return appointmentService.book(customerId(jwt), request);
    }

    @GetMapping
    public List<AppointmentResponse> listMyAppointments(@AuthenticationPrincipal Jwt jwt) {
        return appointmentService.listMyAppointments(customerId(jwt));
    }

    @GetMapping("/{appointmentId}")
    public AppointmentResponse getMyAppointment(@AuthenticationPrincipal Jwt jwt,
                                                @PathVariable Long appointmentId) {
        return appointmentService.getMyAppointment(customerId(jwt), appointmentId);
    }

    // Action endpoints: the client asks for an action, and the server decides the new status.
    // A client can never just send "status": "COMPLETED".
    @PostMapping("/{appointmentId}/reschedule")
    public AppointmentResponse reschedule(@AuthenticationPrincipal Jwt jwt,
                                          @PathVariable Long appointmentId,
                                          @Valid @RequestBody RescheduleRequest request) {
        return appointmentService.reschedule(customerId(jwt), appointmentId, request);
    }

    @PostMapping("/{appointmentId}/cancel")
    public AppointmentResponse cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable Long appointmentId) {
        return appointmentService.cancel(customerId(jwt), appointmentId);
    }

    // Third copy of this helper. Soon we'll replace all three with one shared annotation.
    private Long customerId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}