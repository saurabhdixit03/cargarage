package com.cargarage.backend.config;

import com.cargarage.backend.entity.Admin;
import com.cargarage.backend.repository.AdminRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// Runs once at startup: creates the first admin if there is none yet
@Slf4j
@Component
public class AdminSeeder implements ApplicationRunner {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String name;
    private final String password;

    public AdminSeeder(AdminRepository adminRepository,
                       PasswordEncoder passwordEncoder,
                       @Value("${app.admin.email}") String email,
                       @Value("${app.admin.name}") String name,
                       @Value("${app.admin.password}") String password) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.name = name;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (adminRepository.count() > 0) {
            return; // an admin already exists, nothing to do
        }
        if (email.isBlank() || password.isBlank()) {
            log.warn("No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD to create one at startup.");
            return;
        }

        Admin admin = new Admin();
        admin.setName(name);
        admin.setEmail(email.trim().toLowerCase());
        admin.setPassword(passwordEncoder.encode(password));
        adminRepository.save(admin);

        log.info("Created the first admin account: {}", admin.getEmail());
    }
}