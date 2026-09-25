package com.pulsefit.subscription.controller;

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
                        "name", "subscription-service",
                        "description", "PulseFIT Subscription Plans & Renewals Service",
                        "version", "1.0.0"
                ),
                "status", "UP",
                "port", 8083,
                "swaggerUi", "http://localhost:8083/swagger-ui/index.html"
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "subscription-service",
                "port", 8083
        ));
    }
}
