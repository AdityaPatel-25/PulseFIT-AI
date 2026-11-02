package com.pulsefit.attendance.controller;

import com.pulsefit.attendance.dto.*;
import com.pulsefit.attendance.service.AiCapacityForecastService;
import com.pulsefit.attendance.service.AiFraudDetectionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance/ai")
public class AttendanceAiController {

    private final AiFraudDetectionService aiFraudDetectionService;
    private final AiCapacityForecastService aiCapacityForecastService;

    public AttendanceAiController(AiFraudDetectionService aiFraudDetectionService,
                                  AiCapacityForecastService aiCapacityForecastService) {
        this.aiFraudDetectionService = aiFraudDetectionService;
        this.aiCapacityForecastService = aiCapacityForecastService;
    }

    @PostMapping("/tailgate-check")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<TailgateCheckResult> checkTailgating(@Valid @RequestBody TailgateCheckRequest request) {
        TailgateCheckResult result = aiFraudDetectionService.evaluatePassUsage(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/fraud-alerts")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<FraudAlertDto>> getFraudAlerts() {
        return ResponseEntity.ok(aiFraudDetectionService.getRecentFraudAlerts());
    }

    @GetMapping("/occupancy-heatmap")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'MEMBER')")
    public ResponseEntity<List<FacilityOccupancyDto>> getOccupancyHeatmap() {
        return ResponseEntity.ok(aiCapacityForecastService.getFacilityHeatmap());
    }

    @GetMapping("/facility-forecast/{facilityId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'MEMBER')")
    public ResponseEntity<FacilityForecastDto> getFacilityForecast(@PathVariable("facilityId") String facilityId) {
        return ResponseEntity.ok(aiCapacityForecastService.getFacilityForecast(facilityId));
    }
}
