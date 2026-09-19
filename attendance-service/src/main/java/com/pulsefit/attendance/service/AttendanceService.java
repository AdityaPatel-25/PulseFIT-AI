package com.pulsefit.attendance.service;

import com.pulsefit.attendance.client.MemberClient;
import com.pulsefit.attendance.client.SubscriptionClient;
import com.pulsefit.attendance.dto.*;
import com.pulsefit.attendance.model.Attendance;
import com.pulsefit.attendance.repository.AttendanceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    private static final Logger log = LoggerFactory.getLogger(AttendanceService.class);

    private final AttendanceRepository attendanceRepository;
    private final MemberClient memberClient;
    private final SubscriptionClient subscriptionClient;

    public AttendanceService(AttendanceRepository attendanceRepository, MemberClient memberClient, SubscriptionClient subscriptionClient) {
        this.attendanceRepository = attendanceRepository;
        this.memberClient = memberClient;
        this.subscriptionClient = subscriptionClient;
    }

    public TurnstileResult processCheckIn(CheckInRequest request) {
        Long memberId = request.getMemberId();
        String facilityId = request.getFacilityId();
        String facilityName = request.getFacilityName() != null ? request.getFacilityName() : "Main Facility";

        // Step 1: Inter-service check with Member Service
        MemberDto member = null;
        try {
            member = memberClient.getMemberById(memberId);
        } catch (Exception e) {
            log.error("Failed to retrieve member with ID {}: {}", memberId, e.getMessage());
        }

        if (member == null) {
            recordDeniedAttempt(memberId, facilityId, facilityName, "MEMBER_NOT_FOUND");
            return TurnstileResult.accessDenied(memberId, "Unknown", facilityId, "Member profile not found in system");
        }

        if (!"ACTIVE".equalsIgnoreCase(member.getStatus())) {
            recordDeniedAttempt(memberId, facilityId, facilityName, "MEMBER_SUSPENDED_OR_INACTIVE");
            return TurnstileResult.accessDenied(memberId, member.getName(), facilityId, "Member account is suspended or inactive");
        }

        // Step 2: Inter-service check with Subscription Service
        SubscriptionDto subscription = null;
        try {
            subscription = subscriptionClient.getActiveSubscription(memberId);
        } catch (Exception e) {
            log.warn("Subscription check failed for member ID {}: {}", memberId, e.getMessage());
        }

        if (subscription == null || !subscription.isCurrentlyValid()) {
            recordDeniedAttempt(memberId, facilityId, facilityName, "NO_ACTIVE_SUBSCRIPTION");
            return TurnstileResult.accessDenied(memberId, member.getName(), facilityId, "No active membership subscription or pass has expired");
        }

        // Step 3: Subscription & Member verified -> Grant Access & Log Attendance
        Attendance attendance = new Attendance(
                memberId,
                LocalDateTime.now(),
                facilityId,
                facilityName,
                "GRANTED",
                null
        );

        Attendance saved = attendanceRepository.save(attendance);
        log.info("Turnstile Access GRANTED for Member {} ({}) at Facility {}", member.getName(), memberId, facilityName);

        return TurnstileResult.accessGranted(memberId, member.getName(), facilityId, facilityName, saved.getAttendanceId());
    }

    public AttendanceResponse processCheckOut(CheckOutRequest request) {
        Attendance attendance = null;
        if (request.getAttendanceId() != null) {
            attendance = attendanceRepository.findById(request.getAttendanceId())
                    .orElseThrow(() -> new IllegalArgumentException("Attendance record not found with ID: " + request.getAttendanceId()));
        } else {
            List<Attendance> active = attendanceRepository.findActiveCheckInsForMember(request.getMemberId());
            if (active.isEmpty()) {
                throw new IllegalArgumentException("No open check-in found for Member ID: " + request.getMemberId());
            }
            attendance = active.get(0);
        }

        attendance.setCheckOutTime(LocalDateTime.now());
        Attendance updated = attendanceRepository.save(attendance);
        return AttendanceResponse.fromEntity(updated);
    }

    public List<AttendanceResponse> getAttendanceForMember(Long memberId) {
        return attendanceRepository.findByMemberIdOrderByCheckInTimeDesc(memberId).stream()
                .map(AttendanceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<AttendanceResponse> getRecentAttendance() {
        return attendanceRepository.findTop20ByOrderByCheckInTimeDesc().stream()
                .map(AttendanceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<AttendanceResponse> getDailyFacilityTraffic(String facilityId, LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        LocalDateTime start = targetDate.atStartOfDay();
        LocalDateTime end = targetDate.atTime(23, 59, 59);

        return attendanceRepository.findByFacilityIdAndCheckInTimeBetweenOrderByCheckInTimeDesc(facilityId, start, end).stream()
                .map(AttendanceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private void recordDeniedAttempt(Long memberId, String facilityId, String facilityName, String reason) {
        Attendance denied = new Attendance(
                memberId,
                LocalDateTime.now(),
                facilityId,
                facilityName,
                "DENIED",
                reason
        );
        attendanceRepository.save(denied);
    }
}
