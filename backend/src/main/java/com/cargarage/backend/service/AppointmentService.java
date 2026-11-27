package com.cargarage.backend.service;

import com.cargarage.backend.dto.request.BookAppointmentRequest;
import com.cargarage.backend.dto.request.RescheduleRequest;
import com.cargarage.backend.dto.response.AppointmentResponse;
import com.cargarage.backend.entity.Appointment;
import com.cargarage.backend.entity.AppointmentItem;
import com.cargarage.backend.entity.Car;
import com.cargarage.backend.entity.GarageService;
import com.cargarage.backend.entity.enums.AppointmentStatus;
import com.cargarage.backend.exception.BusinessRuleException;
import com.cargarage.backend.exception.FieldValidationException;
import com.cargarage.backend.exception.ResourceNotFoundException;
import com.cargarage.backend.repository.AppointmentRepository;
import com.cargarage.backend.repository.CarRepository;
import com.cargarage.backend.repository.CustomerRepository;
import com.cargarage.backend.repository.GarageServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    // Bookings are open from tomorrow up to this many days ahead
    private static final int MAX_DAYS_AHEAD = 60;

    // A car can't have two of these on the same day. A REJECTED or CANCELLED booking frees the day again.
    private static final List<AppointmentStatus> ACTIVE_STATUSES =
            List.of(AppointmentStatus.PENDING, AppointmentStatus.ACCEPTED);

    private final AppointmentRepository appointmentRepository;
    private final CarRepository carRepository;
    private final CustomerRepository customerRepository;
    private final GarageServiceRepository garageServiceRepository;

    // READ_COMMITTED: every query sees the latest committed data. So once we hold the car lock,
    // the double-booking check sees any booking another request has just saved.
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public AppointmentResponse book(Long customerId, BookAppointmentRequest request) {
        LocalDate date = request.appointmentDate();
        checkNotTooFarAhead(date);

        // Checks ownership AND locks this car's row until the transaction ends (SELECT ... FOR UPDATE).
        // If the same car is booked twice at the same moment, the second request waits here.
        Car car = carRepository.findLockedByIdAndCustomerId(request.carId(), customerId)
                .orElseThrow(() -> new FieldValidationException("carId", "Car not found"));

        if (appointmentRepository.existsByCarIdAndAppointmentDateAndStatusIn(car.getId(), date, ACTIVE_STATUSES)) {
            throw new BusinessRuleException("This car already has a booking on " + date);
        }

        List<GarageService> services = findAvailableServices(request.serviceIds());

        Appointment appointment = new Appointment();
        appointment.setCustomer(customerRepository.getReferenceById(customerId));
        appointment.setCar(car);
        appointment.setAppointmentDate(date);
        for (GarageService service : services) {
            AppointmentItem item = new AppointmentItem();
            item.setService(service);
            // Price snapshot: if the admin changes the price later, this booking keeps today's price
            item.setPrice(service.getPrice());
            appointment.addItem(item);
        }
        appointment.setTotalAmount(total(appointment));

        // One save: cascade = ALL inserts the items too. Thanks to @Transactional, everything is saved or nothing is.
        return AppointmentResponse.from(appointmentRepository.save(appointment));
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public AppointmentResponse reschedule(Long customerId, Long appointmentId, RescheduleRequest request) {
        Appointment appointment = findMyAppointmentForUpdate(customerId, appointmentId);
        requireChangeable(appointment, "rescheduled");

        LocalDate newDate = request.appointmentDate();
        checkNotTooFarAhead(newDate);
        if (newDate.equals(appointment.getAppointmentDate())) {
            throw new FieldValidationException("appointmentDate", "The booking is already on this date");
        }

        // Same car lock as booking, so a reschedule and a new booking can't both take the same day
        Car car = carRepository.findLockedByIdAndCustomerId(appointment.getCar().getId(), customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Car not found"));

        if (appointmentRepository.existsByCarIdAndAppointmentDateAndStatusInAndIdNot(
                car.getId(), newDate, ACTIVE_STATUSES, appointment.getId())) {
            throw new BusinessRuleException("This car already has a booking on " + newDate);
        }

        appointment.setAppointmentDate(newDate);
        // A new date needs the garage to confirm again. The booked prices stay the same.
        appointment.setStatus(AppointmentStatus.PENDING);
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse cancel(Long customerId, Long appointmentId) {
        Appointment appointment = findMyAppointmentForUpdate(customerId, appointmentId);
        requireChangeable(appointment, "cancelled");
        appointment.setStatus(AppointmentStatus.CANCELLED);
        return AppointmentResponse.from(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listMyAppointments(Long customerId) {
        return appointmentRepository.findByCustomerIdOrderByAppointmentDateDesc(customerId).stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getMyAppointment(Long customerId, Long appointmentId) {
        return AppointmentResponse.from(appointmentRepository.findByIdAndCustomerId(appointmentId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment " + appointmentId + " not found")));
    }

    // Locked read: if the customer and the admin change the same booking at once, the second one waits,
    // so neither change silently overwrites the other (a "lost update")
    private Appointment findMyAppointmentForUpdate(Long customerId, Long appointmentId) {
        return appointmentRepository.findLockedByIdAndCustomerId(appointmentId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment " + appointmentId + " not found"));
    }

    // Customers can change a booking only while it's PENDING or ACCEPTED, and only before the appointment day
    private void requireChangeable(Appointment appointment, String action) {
        if (!ACTIVE_STATUSES.contains(appointment.getStatus())) {
            throw new BusinessRuleException("A " + appointment.getStatus().name().toLowerCase()
                    + " booking can't be " + action);
        }
        if (!appointment.getAppointmentDate().isAfter(LocalDate.now())) {
            throw new BusinessRuleException("Bookings can only be " + action + " before the appointment day");
        }
    }

    private void checkNotTooFarAhead(LocalDate date) {
        if (date.isAfter(LocalDate.now().plusDays(MAX_DAYS_AHEAD))) {
            throw new FieldValidationException("appointmentDate",
                    "You can book at most " + MAX_DAYS_AHEAD + " days ahead");
        }
    }

    // Hidden (inactive) and non-existent services get the same message, so hidden services stay hidden
    private List<GarageService> findAvailableServices(Set<Long> serviceIds) {
        Map<Long, GarageService> available = garageServiceRepository.findAllById(serviceIds).stream()
                .filter(GarageService::isActive)
                .collect(Collectors.toMap(GarageService::getId, Function.identity()));

        List<Long> unavailable = serviceIds.stream()
                .filter(id -> !available.containsKey(id))
                .sorted()
                .toList();
        if (!unavailable.isEmpty()) {
            throw new FieldValidationException("serviceIds", "These services aren't available: " + unavailable);
        }

        return available.values().stream()
                .sorted(Comparator.comparing(GarageService::getName))
                .toList();
    }

    private BigDecimal total(Appointment appointment) {
        return appointment.getItems().stream()
                .map(AppointmentItem::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}