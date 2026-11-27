package com.cargarage.backend.notification;

// Where emails go. Today: the console (LoggingEmailSender). Later: a real SMTP server.
// Code that sends email depends only on this interface, so switching needs no changes there.
public interface EmailSender {

    void send(String to, String subject, String body);
}