package com.pulsefit.attendance.dto;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class FraudAlertDto {

    private String alertId;
    private Long memberId;
    private String memberName;
    private String alertType;
    private int riskScore;
    private String details;
    private String facilityId;
    private String timestamp;

    public FraudAlertDto() {}

    public FraudAlertDto(String alertId, Long memberId, String memberName, String alertType,
                         int riskScore, String details, String facilityId) {
        this.alertId = alertId;
        this.memberId = memberId;
        this.memberName = memberName;
        this.alertType = alertType;
        this.riskScore = riskScore;
        this.details = details;
        this.facilityId = facilityId;
        this.timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    public String getAlertId() {
        return alertId;
    }

    public void setAlertId(String alertId) {
        this.alertId = alertId;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public String getMemberName() {
        return memberName;
    }

    public void setMemberName(String memberName) {
        this.memberName = memberName;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public int getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(int riskScore) {
        this.riskScore = riskScore;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(String facilityId) {
        this.facilityId = facilityId;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
