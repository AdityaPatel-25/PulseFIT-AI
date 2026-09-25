package com.pulsefit.member.controller;

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
                        "name", "member-service",
                        "description", "PulseFIT Member Profile & Lifecycle Management Service",
                        "version", "1.0.0"
                ),
                "status", "UP",
                "port", 8082,
                "swaggerUi", "http://localhost:8082/swagger-ui/index.html"
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "member-service",
                "port", 8082
        ));
    }
}
