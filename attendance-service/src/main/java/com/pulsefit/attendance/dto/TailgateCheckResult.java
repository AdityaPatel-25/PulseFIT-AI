package com.pulsefit.attendance.dto;

public class TailgateCheckResult {

    private boolean safeToProceed;
    private int riskScore; // 0 (Safe) to 100 (Critical Fraud)
    private String alertType; // NORMAL, IMPOSSIBLE_TRAVEL_VELOCITY, RAPID_REENTRY_WITHOUT_CHECKOUT
    private String message;
    private double calculatedSpeedKmh;
    private long minutesSinceLastEvent;
    private String previousFacilityId;

    public TailgateCheckResult() {}

    public TailgateCheckResult(boolean safeToProceed, int riskScore, String alertType, String message,
                               double calculatedSpeedKmh, long minutesSinceLastEvent, String previousFacilityId) {
        this.safeToProceed = safeToProceed;
        this.riskScore = riskScore;
        this.alertType = alertType;
        this.message = message;
        this.calculatedSpeedKmh = calculatedSpeedKmh;
        this.minutesSinceLastEvent = minutesSinceLastEvent;
        this.previousFacilityId = previousFacilityId;
    }

    public static TailgateCheckResult safe(String message) {
        return new TailgateCheckResult(true, 5, "NORMAL", message, 0.0, 0, null);
    }

    public static TailgateCheckResult suspicious(int riskScore, String alertType, String message,
                                                  double speed, long minutes, String prevFacility) {
        return new TailgateCheckResult(riskScore < 75, riskScore, alertType, message, speed, minutes, prevFacility);
    }

    public boolean isSafeToProceed() {
        return safeToProceed;
    }

    public void setSafeToProceed(boolean safeToProceed) {
        this.safeToProceed = safeToProceed;
    }

    public int getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(int riskScore) {
        this.riskScore = riskScore;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public double getCalculatedSpeedKmh() {
        return calculatedSpeedKmh;
    }

    public void setCalculatedSpeedKmh(double calculatedSpeedKmh) {
        this.calculatedSpeedKmh = calculatedSpeedKmh;
    }

    public long getMinutesSinceLastEvent() {
        return minutesSinceLastEvent;
    }

    public void setMinutesSinceLastEvent(long minutesSinceLastEvent) {
        this.minutesSinceLastEvent = minutesSinceLastEvent;
    }

    public String getPreviousFacilityId() {
        return previousFacilityId;
    }

    public void setPreviousFacilityId(String previousFacilityId) {
        this.previousFacilityId = previousFacilityId;
    }
}
