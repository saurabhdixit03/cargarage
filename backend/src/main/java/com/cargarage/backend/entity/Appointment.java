package com.cargarage.backend.entity;

import com.cargarage.backend.entity.enums.AppointmentStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "appointments",
        indexes = {
                // Fast double-booking check: "does this car already have a booking on this date?"
                @Index(name = "idx_appointments_car_date", columnList = "car_id, appointment_date"),
                // Fast admin lists: "all PENDING bookings, sorted by date"
                @Index(name = "idx_appointments_status_date", columnList = "status, appointment_date")
        }
)
public class Appointment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_appointments_customer"))
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "car_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_appointments_car"))
    private Car car;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private AppointmentStatus status = AppointmentStatus.PENDING;

    // Optional discount package applied to this booking
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discount_id",
            foreignKey = @ForeignKey(name = "fk_appointments_discount"))
    private Discount discount;

    // Final amount after the discount, fixed at booking time
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    // One booking has many service lines, saved and deleted together with the booking.
    // No setter: replacing the whole list breaks orphanRemoval. Use addItem() instead.
    @Setter(AccessLevel.NONE)
    @OneToMany(mappedBy = "appointment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AppointmentItem> items = new ArrayList<>();

    // Keeps both sides of the relationship in sync
    public void addItem(AppointmentItem item) {
        items.add(item);
        item.setAppointment(this);
    }
}