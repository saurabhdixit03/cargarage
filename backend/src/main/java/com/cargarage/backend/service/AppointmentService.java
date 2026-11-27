package com.cargarage.backend.service;

import com.cargarage.backend.dto.request.BookAppointmentRequest;
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

    @Transactional
    public AppointmentResponse book(Long customerId, BookAppointmentRequest request) {
        LocalDate date = request.appointmentDate();
        if (date.isAfter(LocalDate.now().plusDays(MAX_DAYS_AHEAD))) {
            throw new FieldValidationException("appointmentDate",
                    "You can book at most " + MAX_DAYS_AHEAD + " days ahead");
        }

        // Checks ownership AND locks this car's row until the transaction ends (SELECT ... FOR UPDATE).
        // If the same car is booked twice at the same moment, the second request waits here,
        // and the check below then sees the first booking. Keep this as the first database read in the method.
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

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listMyAppointments(Long customerId) {
        return appointmentRepository.findByCustomerIdOrderByAppointmentDateDesc(customerId).stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getMyAppointment(Long customerId, Long appointmentId) {
        return AppointmentResponse.from(findMyAppointment(customerId, appointmentId));
    }

    private Appointment findMyAppointment(Long customerId, Long appointmentId) {
        return appointmentRepository.findByIdAndCustomerId(appointmentId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment " + appointmentId + " not found"));
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