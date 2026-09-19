package com.pulsefit.attendance.dto;

public class FacilityOccupancyDto {

    private String facilityId;
    private String facilityName;
    private long currentOccupants;
    private int maxCapacity;
    private double occupancyPercentage;
    private String status; // COMFORTABLE, BALANCED, PEAK_SURGE, CRITICAL_CAPACITY
    private String statusColor;

    public FacilityOccupancyDto() {}

    public FacilityOccupancyDto(String facilityId, String facilityName, long currentOccupants, int maxCapacity) {
        this.facilityId = facilityId;
        this.facilityName = facilityName;
        this.currentOccupants = currentOccupants;
        this.maxCapacity = maxCapacity;
        this.occupancyPercentage = Math.min(100.0, Math.round((currentOccupants * 100.0 / maxCapacity) * 10.0) / 10.0);

        if (this.occupancyPercentage < 40.0) {
            this.status = "COMFORTABLE";
            this.statusColor = "#10b981"; // Emerald
        } else if (this.occupancyPercentage < 75.0) {
            this.status = "BALANCED";
            this.statusColor = "#06b6d4"; // Cyan
        } else if (this.occupancyPercentage < 90.0) {
            this.status = "PEAK_SURGE";
            this.statusColor = "#f59e0b"; // Amber
        } else {
            this.status = "CRITICAL_CAPACITY";
            this.statusColor = "#ef4444"; // Red
        }
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

    public long getCurrentOccupants() {
        return currentOccupants;
    }

    public void setCurrentOccupants(long currentOccupants) {
        this.currentOccupants = currentOccupants;
    }

    public int getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(int maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public double getOccupancyPercentage() {
        return occupancyPercentage;
    }

    public void setOccupancyPercentage(double occupancyPercentage) {
        this.occupancyPercentage = occupancyPercentage;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStatusColor() {
        return statusColor;
    }

    public void setStatusColor(String statusColor) {
        this.statusColor = statusColor;
    }
}
