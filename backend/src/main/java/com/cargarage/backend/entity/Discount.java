package com.cargarage.backend.entity;

import com.cargarage.backend.entity.enums.CustomerType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "discounts")
public class Discount extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;                // e.g. Monsoon Offer

    @Column(nullable = false, length = 500)
    private String description;

    // e.g. 15.00 means 15%
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(name = "valid_until", nullable = false)
    private LocalDate validUntil;

    // Which group of customers this offer targets
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "target_customer_type", nullable = false, length = 20)
    private CustomerType targetCustomerType;

    @Column(nullable = false)
    private boolean active = true;

    // Many discounts <-> many services, stored in the join table discount_services
    @ManyToMany
    @JoinTable(
            name = "discount_services",
            joinColumns = @JoinColumn(name = "discount_id",
                    foreignKey = @ForeignKey(name = "fk_discount_services_discount")),
            inverseJoinColumns = @JoinColumn(name = "service_id",
                    foreignKey = @ForeignKey(name = "fk_discount_services_service"))
    )
    private Set<GarageService> services = new HashSet<>();
}