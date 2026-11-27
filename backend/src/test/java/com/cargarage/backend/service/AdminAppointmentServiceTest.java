package com.cargarage.backend.service;

import com.cargarage.backend.entity.Appointment;
import com.cargarage.backend.entity.Car;
import com.cargarage.backend.entity.Customer;
import com.cargarage.backend.entity.enums.AppointmentStatus;
import com.cargarage.backend.entity.enums.CustomerType;
import com.cargarage.backend.exception.BusinessRuleException;
import com.cargarage.backend.exception.ResourceNotFoundException;
import com.cargarage.backend.repository.AppointmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAppointmentServiceTest {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final LocalDate TODAY = LocalDate.of(2026, 12, 1);

    @Mock
    private AppointmentRepository appointmentRepository;

    private AdminAppointmentService service;

    @BeforeEach
    void setUp() {
        // "Today" is always 1 Dec 2026 here. No more editing MySQL to fake the date.
        Clock fixedClock = Clock.fixed(TODAY.atTime(10, 0).atZone(IST).toInstant(), IST);
        service = new AdminAppointmentService(appointmentRepository, fixedClock);
    }

    @Test
    @DisplayName("Completing on the appointment day marks it COMPLETED and makes the customer REPEAT")
    void completeOnTheDay() {
        Appointment appointment = givenAppointment(AppointmentStatus.ACCEPTED, TODAY);

        service.complete(1L);

        assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.COMPLETED);
        assertThat(appointment.getCustomer().getCustomerType()).isEqualTo(CustomerType.REPEAT);
    }

    @Test
    @DisplayName("A booking can't be completed before its day, and nothing changes")
    void completeBeforeTheDayIsRefused() {
        Appointment appointment = givenAppointment(AppointmentStatus.ACCEPTED, TODAY.plusDays(1));

        assertThatThrownBy(() -> service.complete(1L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("before its appointment day");
        assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.ACCEPTED);
        assertThat(appointment.getCustomer().getCustomerType()).isEqualTo(CustomerType.REGULAR);
    }

    @Test
    @DisplayName("A pending booking can be accepted")
    void acceptPending() {
        Appointment appointment = givenAppointment(AppointmentStatus.PENDING, TODAY.plusDays(3));

        service.accept(1L);

        assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.ACCEPTED);
    }

    @Test
    @DisplayName("A booking whose date has passed can't be accepted")
    void acceptPastDateIsRefused() {
        givenAppointment(AppointmentStatus.PENDING, TODAY.minusDays(1));

        assertThatThrownBy(() -> service.accept(1L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already passed");
    }

    // Runs once for every status except PENDING: only PENDING bookings may be accepted
    @ParameterizedTest(name = "a {0} booking can't be accepted")
    @EnumSource(value = AppointmentStatus.class, names = "PENDING", mode = EnumSource.Mode.EXCLUDE)
    void onlyPendingCanBeAccepted(AppointmentStatus status) {
        Appointment appointment = givenAppointment(status, TODAY.plusDays(3));

        assertThatThrownBy(() -> service.accept(1L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Only pending bookings can be accepted");
        assertThat(appointment.getStatus()).isEqualTo(status);
    }

    @Test
    @DisplayName("An unknown booking id gives ResourceNotFoundException")
    void unknownBooking() {
        // No stubbing needed: for a method returning Optional, a Mockito mock returns Optional.empty()
        assertThatThrownBy(() -> service.reject(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Appointment 99 not found");
    }

    // Builds a booking and makes the mocked repository return it for id 1
    private Appointment givenAppointment(AppointmentStatus status, LocalDate date) {
        Customer customer = new Customer();
        customer.setName("Test Customer");
        customer.setCustomerType(CustomerType.REGULAR);

        Car car = new Car();
        car.setMake("Hyundai");
        car.setModel("Creta");
        car.setColor("White");
        car.setLicensePlate("MH12AB1234");

        Appointment appointment = new Appointment();
        appointment.setCustomer(customer);
        appointment.setCar(car);
        appointment.setAppointmentDate(date);
        appointment.setStatus(status);
        appointment.setTotalAmount(new BigDecimal("2500.00"));

        when(appointmentRepository.findLockedById(1L)).thenReturn(Optional.of(appointment));
        return appointment;
    }
}