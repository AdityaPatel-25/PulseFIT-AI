package com.pulsefit.attendance.dto;

import java.time.LocalDate;

public class SubscriptionDto {
    private Long subscriptionId;
    private Long memberId;
    private String planType;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private String status;
    private String facilityTier;
    private boolean isCurrentlyValid;

    public SubscriptionDto() {}

    public Long getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(Long subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public String getPlanType() {
        return planType;
    }

    public void setPlanType(String planType) {
        this.planType = planType;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getFacilityTier() {
        return facilityTier;
    }

    public void setFacilityTier(String facilityTier) {
        this.facilityTier = facilityTier;
    }

    public boolean isCurrentlyValid() {
        return isCurrentlyValid;
    }

    public void setCurrentlyValid(boolean currentlyValid) {
        isCurrentlyValid = currentlyValid;
    }
}
