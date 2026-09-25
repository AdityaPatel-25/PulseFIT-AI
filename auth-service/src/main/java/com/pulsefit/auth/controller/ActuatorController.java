package com.pulsefit.auth.controller;

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
                        "name", "auth-service",
                        "description", "PulseFIT Authentication & JWT Security Service",
                        "version", "1.0.0"
                ),
                "status", "UP",
                "port", 8081,
                "swaggerUi", "http://localhost:8081/swagger-ui/index.html"
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "auth-service",
                "port", 8081
        ));
    }
}
