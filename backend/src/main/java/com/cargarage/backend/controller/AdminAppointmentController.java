package com.cargarage.backend.controller;

import com.cargarage.backend.dto.response.AdminAppointmentResponse;
import com.cargarage.backend.entity.enums.AppointmentStatus;
import com.cargarage.backend.service.AdminAppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// SecurityConfig already limits /api/admin/** to ADMIN tokens
@RestController
@RequestMapping("/api/admin/appointments")
@RequiredArgsConstructor
public class AdminAppointmentController {

    private final AdminAppointmentService adminAppointmentService;

    // GET /api/admin/appointments?status=PENDING (status is optional)
    @GetMapping
    public List<AdminAppointmentResponse> list(@RequestParam(required = false) AppointmentStatus status) {
        return adminAppointmentService.list(status);
    }

    @GetMapping("/{appointmentId}")
    public AdminAppointmentResponse get(@PathVariable Long appointmentId) {
        return adminAppointmentService.get(appointmentId);
    }

    @PostMapping("/{appointmentId}/accept")
    public AdminAppointmentResponse accept(@PathVariable Long appointmentId) {
        return adminAppointmentService.accept(appointmentId);
    }

    @PostMapping("/{appointmentId}/reject")
    public AdminAppointmentResponse reject(@PathVariable Long appointmentId) {
        return adminAppointmentService.reject(appointmentId);
    }

    @PostMapping("/{appointmentId}/complete")
    public AdminAppointmentResponse complete(@PathVariable Long appointmentId) {
        return adminAppointmentService.complete(appointmentId);
    }
}