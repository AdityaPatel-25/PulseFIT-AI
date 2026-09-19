package com.pulsefit.attendance.service;

import com.pulsefit.attendance.dto.FraudAlertDto;
import com.pulsefit.attendance.dto.TailgateCheckRequest;
import com.pulsefit.attendance.dto.TailgateCheckResult;
import com.pulsefit.attendance.model.Attendance;
import com.pulsefit.attendance.repository.AttendanceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
public class AiFraudDetectionService {

    private static final Logger log = LoggerFactory.getLogger(AiFraudDetectionService.class);

    private final AttendanceRepository attendanceRepository;
    private final ConcurrentLinkedDeque<FraudAlertDto> fraudAlerts = new ConcurrentLinkedDeque<>();

    // Estimated transit distance matrix in kilometers between PulseFIT branches
    private static final Map<String, Double> DISTANCE_MATRIX = new HashMap<>();

    static {
        DISTANCE_MATRIX.put("downtown_elite:uptown_olympic", 9.2);
        DISTANCE_MATRIX.put("uptown_olympic:downtown_elite", 9.2);
        DISTANCE_MATRIX.put("downtown_elite:westside_express", 6.5);
        DISTANCE_MATRIX.put("westside_express:downtown_elite", 6.5);
        DISTANCE_MATRIX.put("uptown_olympic:westside_express", 11.0);
        DISTANCE_MATRIX.put("westside_express:uptown_olympic", 11.0);
    }

    public AiFraudDetectionService(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
        seedInitialAlerts();
    }

    private void seedInitialAlerts() {
        fraudAlerts.add(new FraudAlertDto(
                "ALT-" + UUID.randomUUID().toString().substring(0, 8),
                3L,
                "Marcus Vance",
                "RAPID_REENTRY_WITHOUT_CHECKOUT",
                85,
                "Turnstile scanned twice within 2 mins at Westside Express without checkout. Physical tailgating suspected.",
                "westside_express"
        ));
        fraudAlerts.add(new FraudAlertDto(
                "ALT-" + UUID.randomUUID().toString().substring(0, 8),
                2L,
                "Sarah Jenkins",
                "IMPOSSIBLE_TRAVEL_VELOCITY",
                92,
                "Pass scanned at Downtown Elite 12 mins after check-in at Uptown Olympic (Calculated Velocity: 92 km/h). RFID credential sharing flagged.",
                "downtown_elite"
        ));
    }

    public TailgateCheckResult evaluatePassUsage(TailgateCheckRequest request) {
        Long memberId = request.getMemberId();
        String currentFacility = request.getFacilityId();

        Optional<Attendance> lastCheckInOpt = attendanceRepository
                .findFirstByMemberIdAndAccessStatusOrderByCheckInTimeDesc(memberId, "GRANTED");

        if (lastCheckInOpt.isEmpty()) {
            return TailgateCheckResult.safe("Initial check-in verified. Zero historical conflict.");
        }

        Attendance last = lastCheckInOpt.get();
        LocalDateTime now = LocalDateTime.now();
        long elapsedMinutes = Math.max(1, Duration.between(last.getCheckInTime(), now).toMinutes());
        String prevFacility = last.getFacilityId();

        // Check 1: Same Facility Rapid Re-entry without checkout (Pass Handback)
        if (currentFacility.equalsIgnoreCase(prevFacility)) {
            if (last.getCheckOutTime() == null && elapsedMinutes <= 5) {
                String detail = String.format("Member attempted re-entry at %s within %d min(s) without checkout. Pass handback / tailgating suspected.", currentFacility, elapsedMinutes);
                recordAlert(memberId, "Member #" + memberId, "RAPID_REENTRY_WITHOUT_CHECKOUT", 85, detail, currentFacility);
                return TailgateCheckResult.suspicious(85, "RAPID_REENTRY_WITHOUT_CHECKOUT", detail, 0.0, elapsedMinutes, prevFacility);
            }
        } else {
            // Check 2: Different Facility Impossible Travel Velocity
            String routeKey = prevFacility.toLowerCase() + ":" + currentFacility.toLowerCase();
            double distanceKm = DISTANCE_MATRIX.getOrDefault(routeKey, 8.0);
            double speedKmh = distanceKm / (elapsedMinutes / 60.0);

            // In urban city driving, average speed > 80 km/h between facilities indicates credential sharing
            if (elapsedMinutes < 30 && speedKmh > 80.0) {
                String detail = String.format("Impossible transit: Check-in at %s occurred %d mins after %s (Calculated velocity: %.1f km/h). QR/RFID credential sharing detected!",
                        currentFacility, elapsedMinutes, prevFacility, speedKmh);
                recordAlert(memberId, "Member #" + memberId, "IMPOSSIBLE_TRAVEL_VELOCITY", 95, detail, currentFacility);
                return TailgateCheckResult.suspicious(95, "IMPOSSIBLE_TRAVEL_VELOCITY", detail, speedKmh, elapsedMinutes, prevFacility);
            }
        }

        return TailgateCheckResult.safe(String.format("Heuristic scan normal. Last scan was %d mins ago at %s.", elapsedMinutes, prevFacility));
    }

    public List<FraudAlertDto> getRecentFraudAlerts() {
        return new ArrayList<>(fraudAlerts);
    }

    private void recordAlert(Long memberId, String memberName, String alertType, int riskScore, String details, String facilityId) {
        FraudAlertDto alert = new FraudAlertDto(
                "ALT-" + UUID.randomUUID().toString().substring(0, 8),
                memberId,
                memberName,
                alertType,
                riskScore,
                details,
                facilityId
        );
        fraudAlerts.addFirst(alert);
        while (fraudAlerts.size() > 50) {
            fraudAlerts.pollLast();
        }
        log.warn("AI FRAUD ALERT GENERATED: [{}] Member {} at Facility {}: {}", alertType, memberId, facilityId, details);
    }
}
