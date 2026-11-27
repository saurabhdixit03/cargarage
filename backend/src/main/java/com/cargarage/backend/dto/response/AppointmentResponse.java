package com.cargarage.backend.dto.response;

import com.cargarage.backend.entity.Appointment;
import com.cargarage.backend.entity.AppointmentItem;
import com.cargarage.backend.entity.enums.AppointmentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AppointmentResponse(
        Long id,
        LocalDate appointmentDate,
        AppointmentStatus status,
        CarResponse car,
        List<Item> items,
        BigDecimal totalAmount
) {

    // One booked service, with the price that applied when it was booked
    public record Item(Long serviceId, String serviceName, BigDecimal price) {

        static Item from(AppointmentItem item) {
            return new Item(item.getService().getId(), item.getService().getName(), item.getPrice());
        }
    }

    public static AppointmentResponse from(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getAppointmentDate(),
                appointment.getStatus(),
                CarResponse.from(appointment.getCar()),
                appointment.getItems().stream().map(Item::from).toList(),
                appointment.getTotalAmount());
    }
}