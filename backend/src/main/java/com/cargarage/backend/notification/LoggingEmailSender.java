package com.cargarage.backend.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

// Development stand-in: writes each email to the log instead of sending it
@Slf4j
@Component
public class LoggingEmailSender implements EmailSender {

    @Override
    public void send(String to, String subject, String body) {
        log.info("EMAIL to={} | subject={} | body={}", to, subject, body);
    }
}