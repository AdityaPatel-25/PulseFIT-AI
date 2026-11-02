package com.pulsefit.subscription.dto;

import com.pulsefit.subscription.entity.MembershipPlan;
import com.pulsefit.subscription.entity.Subscription;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class SubscriptionResponse {

    private Long subscriptionId;
    private Long memberId;
    private Long planId;
    private String planName;
    private String planType; // Alias for planName for backward compatibility
    private LocalDate startDate;
    private LocalDate expiryDate;
    private String status;
    private Integer durationInDays;
    private Double price;
    private String facilityTier;
    private boolean isCurrentlyValid;
    private LocalDateTime createdAt;

    public SubscriptionResponse() {}

    public static SubscriptionResponse fromEntity(Subscription sub) {
        if (sub == null) return null;
        SubscriptionResponse res = new SubscriptionResponse();
        res.setSubscriptionId(sub.getSubscriptionId());
        res.setMemberId(sub.getMemberId());
        res.setPlanId(sub.getPlanId());

        MembershipPlan plan = sub.getPlan();
        if (plan != null) {
            res.setPlanName(plan.getPlanName());
            res.setPlanType(plan.getPlanName());
            res.setDurationInDays(plan.getDurationInDays());
            res.setPrice(plan.getPrice());
        } else {
            res.setPlanName(sub.getPlanType());
            res.setPlanType(sub.getPlanType());
            res.setPrice(sub.getPrice());
        }

        res.setStartDate(sub.getStartDate());
        res.setExpiryDate(sub.getExpiryDate());
        res.setStatus(sub.getStatus());
        res.setFacilityTier(sub.getFacilityTier());
        res.setCreatedAt(sub.getCreatedAt());

        boolean valid = "ACTIVE".equalsIgnoreCase(sub.getStatus()) &&
                (sub.getExpiryDate() != null && !sub.getExpiryDate().isBefore(LocalDate.now()));
        res.setCurrentlyValid(valid);
        return res;
    }

    public static SubscriptionResponse fromEntity(Subscription sub, MembershipPlan plan) {
        SubscriptionResponse res = fromEntity(sub);
        if (res != null && plan != null) {
            res.setPlanName(plan.getPlanName());
            res.setPlanType(plan.getPlanName());
            res.setDurationInDays(plan.getDurationInDays());
            res.setPrice(plan.getPrice());
        }
        return res;
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

    public Integer getDurationInDays() {
        return durationInDays;
    }

    public void setDurationInDays(Integer durationInDays) {
        this.durationInDays = durationInDays;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
