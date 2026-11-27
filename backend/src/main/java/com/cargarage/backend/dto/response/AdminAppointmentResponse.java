package com.cargarage.backend.dto.response;

import com.cargarage.backend.entity.Appointment;
import com.cargarage.backend.entity.Customer;
import com.cargarage.backend.entity.enums.AppointmentStatus;
import com.cargarage.backend.entity.enums.CustomerType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

// What the admin sees: the booking plus who booked it. Customers don't need this part, so they get AppointmentResponse.
public record AdminAppointmentResponse(
        Long id,
        LocalDate appointmentDate,
        AppointmentStatus status,
        CustomerSummary customer,
        CarResponse car,
        List<AppointmentResponse.Item> items,
        BigDecimal totalAmount
) {

    public record CustomerSummary(Long id, String name, String email, String mobile, CustomerType customerType) {

        static CustomerSummary from(Customer customer) {
            return new CustomerSummary(customer.getId(), customer.getName(), customer.getEmail(),
                    customer.getMobile(), customer.getCustomerType());
        }
    }

    public static AdminAppointmentResponse from(Appointment appointment) {
        return new AdminAppointmentResponse(
                appointment.getId(),
                appointment.getAppointmentDate(),
                appointment.getStatus(),
                CustomerSummary.from(appointment.getCustomer()),
                CarResponse.from(appointment.getCar()),
                appointment.getItems().stream().map(AppointmentResponse.Item::from).toList(),
                appointment.getTotalAmount());
    }
}