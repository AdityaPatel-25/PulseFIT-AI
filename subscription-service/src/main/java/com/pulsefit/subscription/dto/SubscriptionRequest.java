package com.pulsefit.subscription.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class SubscriptionRequest {

    @NotNull(message = "Member ID is required")
    private Long memberId;

    @NotNull(message = "Plan ID is required")
    private Long planId;

    private LocalDate startDate; // Defaults to LocalDate.now() if omitted

    // Optional fields for flexibility and backwards compatibility
    private String planType;
    private Integer durationMonths;
    private String facilityTier;
    private Double price;
    private Boolean autoRenew;

    public SubscriptionRequest() {}

    public SubscriptionRequest(Long memberId, Long planId) {
        this.memberId = memberId;
        this.planId = planId;
        this.startDate = LocalDate.now();
    }

    public SubscriptionRequest(Long memberId, Long planId, LocalDate startDate) {
        this.memberId = memberId;
        this.planId = planId;
        this.startDate = startDate;
    }

    public SubscriptionRequest(Long memberId, String planType, LocalDate startDate, Integer durationMonths, String facilityTier, Double price, Boolean autoRenew) {
        this.memberId = memberId;
        this.planType = planType;
        this.startDate = startDate;
        this.durationMonths = durationMonths;
        this.facilityTier = facilityTier;
        this.price = price;
        this.autoRenew = autoRenew;
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

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public String getPlanType() {
        return planType;
    }

    public void setPlanType(String planType) {
        this.planType = planType;
    }

    public Integer getDurationMonths() {
        return durationMonths;
    }

    public void setDurationMonths(Integer durationMonths) {
        this.durationMonths = durationMonths;
    }

    public String getFacilityTier() {
        return facilityTier;
    }

    public void setFacilityTier(String facilityTier) {
        this.facilityTier = facilityTier;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Boolean getAutoRenew() {
        return autoRenew;
    }

    public void setAutoRenew(Boolean autoRenew) {
        this.autoRenew = autoRenew;
    }
}
