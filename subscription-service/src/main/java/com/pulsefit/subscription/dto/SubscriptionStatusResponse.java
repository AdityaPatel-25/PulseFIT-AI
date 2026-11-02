package com.pulsefit.subscription.dto;

import java.time.LocalDate;

public class SubscriptionStatusResponse {

    private Long subscriptionId;
    private Long memberId;
    private Long planId;
    private String planName;
    private String status;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private Long daysRemaining;
    private Boolean isValid;
    private Boolean isExpired;

    public SubscriptionStatusResponse() {}

    public SubscriptionStatusResponse(Long subscriptionId, Long memberId, Long planId, String planName, String status, LocalDate startDate, LocalDate expiryDate, Long daysRemaining, Boolean isValid, Boolean isExpired) {
        this.subscriptionId = subscriptionId;
        this.memberId = memberId;
        this.planId = planId;
        this.planName = planName;
        this.status = status;
        this.startDate = startDate;
        this.expiryDate = expiryDate;
        this.daysRemaining = daysRemaining;
        this.isValid = isValid;
        this.isExpired = isExpired;
    }

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

    public Long getPlanId() {
        return planId;
    }

    public void setPlanId(Long planId) {
        this.planId = planId;
    }

    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public Long getDaysRemaining() {
        return daysRemaining;
    }

    public void setDaysRemaining(Long daysRemaining) {
        this.daysRemaining = daysRemaining;
    }

    public Boolean getIsValid() {
        return isValid;
    }

    public void setIsValid(Boolean valid) {
        isValid = valid;
    }

    public Boolean getIsExpired() {
        return isExpired;
    }

    public void setIsExpired(Boolean expired) {
        isExpired = expired;
    }
}
