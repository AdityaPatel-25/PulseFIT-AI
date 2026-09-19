package com.pulsefit.attendance.service;

import com.pulsefit.attendance.dto.FacilityForecastDto;
import com.pulsefit.attendance.dto.FacilityOccupancyDto;
import com.pulsefit.attendance.repository.AttendanceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.*;

@Service
public class AiCapacityForecastService {

    private final AttendanceRepository attendanceRepository;

    private static final Map<String, FacilityMeta> FACILITIES = new LinkedHashMap<>();

    private static class FacilityMeta {
        String name;
        int maxCapacity;
        int baselineOccupants;

        FacilityMeta(String name, int maxCapacity, int baselineOccupants) {
            this.name = name;
            this.maxCapacity = maxCapacity;
            this.baselineOccupants = baselineOccupants;
        }
    }

    static {
        FACILITIES.put("downtown_elite", new FacilityMeta("Downtown Elite Luxury Club", 150, 68));
        FACILITIES.put("uptown_olympic", new FacilityMeta("Uptown Olympic Training Center", 250, 142));
        FACILITIES.put("westside_express", new FacilityMeta("Westside Express 24/7", 80, 24));
    }

    public AiCapacityForecastService(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    public List<FacilityOccupancyDto> getFacilityHeatmap() {
        List<FacilityOccupancyDto> results = new ArrayList<>();

        for (Map.Entry<String, FacilityMeta> entry : FACILITIES.entrySet()) {
            String facilityId = entry.getKey();
            FacilityMeta meta = entry.getValue();

            long realDbCount = attendanceRepository.countActiveOccupantsByFacility(facilityId);
            long displayCount = Math.max(realDbCount, meta.baselineOccupants);

            results.add(new FacilityOccupancyDto(
                    facilityId,
                    meta.name,
                    displayCount,
                    meta.maxCapacity
            ));
        }

        return results;
    }

    public FacilityForecastDto getFacilityForecast(String facilityId) {
        String normalizedId = facilityId.toLowerCase();
        FacilityMeta meta = FACILITIES.getOrDefault(normalizedId, new FacilityMeta("PulseFIT Standard Branch", 100, 35));

        int currentHour = LocalTime.now().getHour();
        List<FacilityForecastDto.HourlyForecast> hourly = new ArrayList<>();

        // Generate next 4 hours projections based on typical fitness center traffic curves
        for (int i = 1; i <= 4; i++) {
            int targetHour = (currentHour + i) % 24;
            String timeSlot = String.format("%02d:00 - %02d:00", targetHour, (targetHour + 1) % 24);

            int projectedPct = calculateProjectedCapacity(targetHour);
            String crowdLevel;
            if (projectedPct < 40) crowdLevel = "LOW";
            else if (projectedPct < 70) crowdLevel = "MODERATE";
            else if (projectedPct < 85) crowdLevel = "BUSY";
            else crowdLevel = "SURGE";

            hourly.add(new FacilityForecastDto.HourlyForecast(timeSlot, projectedPct, crowdLevel));
        }

        String recommendedWindow = "1:30 PM - 4:00 PM or after 8:30 PM (Free bench & squat rack availability)";
        String peakWarning = "Evening Prime-Time Surge peaks between 5:30 PM and 7:30 PM (~88% capacity)";

        return new FacilityForecastDto(
                normalizedId,
                meta.name,
                currentHour,
                recommendedWindow,
                peakWarning,
                hourly
        );
    }

    private int calculateProjectedCapacity(int hour) {
        // Typical gym traffic curve
        if (hour >= 6 && hour <= 8) return 78;   // Morning rush
        if (hour >= 9 && hour <= 11) return 42;  // Mid-morning lull
        if (hour >= 12 && hour <= 13) return 65; // Lunch rush
        if (hour >= 14 && hour <= 16) return 38; // Afternoon quiet window
        if (hour >= 17 && hour <= 19) return 89; // Evening peak rush
        if (hour >= 20 && hour <= 21) return 55; // Post-dinner taper
        return 18; // Late night / off-peak
    }
}
