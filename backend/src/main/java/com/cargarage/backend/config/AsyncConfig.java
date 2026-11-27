package com.cargarage.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

// Switches on @Async. Spring Boot already provides the thread pool; its threads are named task-1, task-2, ...
@Configuration
@EnableAsync
public class AsyncConfig {
}