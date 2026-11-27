package com.cargarage.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class ClockConfig {

    // The garage works on Indian time, wherever the server runs (cloud servers usually run on UTC).
    // Services ask this Clock for "today" instead of calling LocalDate.now() directly,
    // so a test can pass a fixed Clock and pretend it's any day it likes.
    @Bean
    public Clock clock() {
        return Clock.system(ZoneId.of("Asia/Kolkata"));
    }
}