package com.pulsefit.attendance.dto;

import java.util.List;

public class FacilityForecastDto {

    private String facilityId;
    private String facilityName;
    private int currentHour;
    private String recommendedWorkoutWindow;
    private String peakHourWarning;
    private List<HourlyForecast> hourlyForecasts;

    public static class HourlyForecast {
        private String timeSlot;
        private int projectedOccupancyPct;
        private String crowdLevel; // LOW, MODERATE, BUSY, SURGE

        public HourlyForecast() {}

        public HourlyForecast(String timeSlot, int projectedOccupancyPct, String crowdLevel) {
            this.timeSlot = timeSlot;
            this.projectedOccupancyPct = projectedOccupancyPct;
            this.crowdLevel = crowdLevel;
        }

        public String getTimeSlot() {
            return timeSlot;
        }

        public void setTimeSlot(String timeSlot) {
            this.timeSlot = timeSlot;
        }

        public int getProjectedOccupancyPct() {
            return projectedOccupancyPct;
        }

        public void setProjectedOccupancyPct(int projectedOccupancyPct) {
            this.projectedOccupancyPct = projectedOccupancyPct;
        }

        public String getCrowdLevel() {
            return crowdLevel;
        }

        public void setCrowdLevel(String crowdLevel) {
            this.crowdLevel = crowdLevel;
        }
    }

    public FacilityForecastDto() {}

    public FacilityForecastDto(String facilityId, String facilityName, int currentHour,
                               String recommendedWorkoutWindow, String peakHourWarning,
                               List<HourlyForecast> hourlyForecasts) {
        this.facilityId = facilityId;
        this.facilityName = facilityName;
        this.currentHour = currentHour;
        this.recommendedWorkoutWindow = recommendedWorkoutWindow;
        this.peakHourWarning = peakHourWarning;
        this.hourlyForecasts = hourlyForecasts;
    }

    public String getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(String facilityId) {
        this.facilityId = facilityId;
    }

    public String getFacilityName() {
        return facilityName;
    }

    public void setFacilityName(String facilityName) {
        this.facilityName = facilityName;
    }

    public int getCurrentHour() {
        return currentHour;
    }

    public void setCurrentHour(int currentHour) {
        this.currentHour = currentHour;
    }

    public String getRecommendedWorkoutWindow() {
        return recommendedWorkoutWindow;
    }

    public void setRecommendedWorkoutWindow(String recommendedWorkoutWindow) {
        this.recommendedWorkoutWindow = recommendedWorkoutWindow;
    }

    public String getPeakHourWarning() {
        return peakHourWarning;
    }

    public void setPeakHourWarning(String peakHourWarning) {
        this.peakHourWarning = peakHourWarning;
    }

    public List<HourlyForecast> getHourlyForecasts() {
        return hourlyForecasts;
    }

    public void setHourlyForecasts(List<HourlyForecast> hourlyForecasts) {
        this.hourlyForecasts = hourlyForecasts;
    }
}
