package com.pulsefit.attendance.controller;

import com.pulsefit.attendance.dto.AttendanceResponse;
import com.pulsefit.attendance.dto.CheckInRequest;
import com.pulsefit.attendance.dto.CheckOutRequest;
import com.pulsefit.attendance.dto.TurnstileResult;
import com.pulsefit.attendance.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/check-in")
    public ResponseEntity<TurnstileResult> checkIn(@Valid @RequestBody CheckInRequest request) {
        TurnstileResult result = attendanceService.processCheckIn(request);
        if (result.isGranted()) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(result);
        }
    }

    @PostMapping("/check-out")
    public ResponseEntity<?> checkOut(@Valid @RequestBody CheckOutRequest request) {
        try {
            AttendanceResponse response = attendanceService.processCheckOut(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<AttendanceResponse>> getMemberAttendance(@PathVariable("memberId") Long memberId) {
        return ResponseEntity.ok(attendanceService.getAttendanceForMember(memberId));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<AttendanceResponse>> getRecentAttendance() {
        return ResponseEntity.ok(attendanceService.getRecentAttendance());
    }

    @GetMapping("/facility/{facilityId}")
    public ResponseEntity<List<AttendanceResponse>> getFacilityDailyTraffic(
            @PathVariable("facilityId") String facilityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getDailyFacilityTraffic(facilityId, date));
    }
}
