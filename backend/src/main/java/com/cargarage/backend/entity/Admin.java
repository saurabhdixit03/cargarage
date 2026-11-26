package com.cargarage.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "admins",
        uniqueConstraints = @UniqueConstraint(name = "uk_admins_email", columnNames = "email")
)
public class Admin extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 150)
    private String email;

    // Stores the BCrypt hash, never the plain password
    @Column(nullable = false, length = 100)
    private String password;
}