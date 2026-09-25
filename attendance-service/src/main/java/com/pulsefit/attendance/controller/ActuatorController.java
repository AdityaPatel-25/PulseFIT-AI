package com.pulsefit.attendance.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/actuator")
public class ActuatorController {

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> info() {
        return ResponseEntity.ok(Map.of(
                "app", Map.of(
                        "name", "attendance-service",
                        "description", "PulseFIT RFID Turnstile & Attendance Service",
                        "version", "1.0.0"
                ),
                "status", "UP",
                "port", 8084,
                "swaggerUi", "http://localhost:8084/swagger-ui/index.html"
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "attendance-service",
                "port", 8084
        ));
    }
}
