package com.cargarage.backend.entity;

import com.cargarage.backend.entity.enums.CustomerType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "customers",
        uniqueConstraints = @UniqueConstraint(name = "uk_customers_email", columnNames = "email")
)
public class Customer extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 15)
    private String mobile;

    // Stores the BCrypt hash, never the plain password
    @Column(nullable = false, length = 100)
    private String password;

    // Stored as VARCHAR (standard SQL, not a MySQL-only ENUM). The migration adds a CHECK constraint
    // listing the allowed values, so a new enum value also needs a new migration that updates it.
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "customer_type", nullable = false, length = 20)
    private CustomerType customerType = CustomerType.REGULAR;
}