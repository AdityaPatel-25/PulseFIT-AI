package com.pulsefit.subscription.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class SubscriptionRequest {

    @NotNull(message = "Member ID is required")
    private Long memberId;

    @NotNull(message = "Plan type is required")
    private String planType; // BASIC_MONTHLY, PREMIUM_QUARTERLY, ALL_ACCESS_ANNUAL

    private LocalDate startDate; // Defaults to now if omitted
    private Integer durationMonths; // Defaults based on plan if omitted
    private String facilityTier; // SINGLE_FACILITY, MULTI_FACILITY
    private Double price;
    private Boolean autoRenew;

    public SubscriptionRequest() {}

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
