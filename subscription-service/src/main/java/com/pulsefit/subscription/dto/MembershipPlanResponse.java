package com.pulsefit.subscription.dto;

import com.pulsefit.subscription.entity.MembershipPlan;
import java.time.LocalDateTime;

public class MembershipPlanResponse {

    private Long planId;
    private String planName;
    private String description;
    private Integer durationInDays;
    private Double price;
    private Boolean active;
    private LocalDateTime createdAt;

    public MembershipPlanResponse() {}

    public MembershipPlanResponse(Long planId, String planName, String description, Integer durationInDays, Double price, Boolean active, LocalDateTime createdAt) {
        this.planId = planId;
        this.planName = planName;
        this.description = description;
        this.durationInDays = durationInDays;
        this.price = price;
        this.active = active;
        this.createdAt = createdAt;
    }

    public static MembershipPlanResponse fromEntity(MembershipPlan plan) {
        if (plan == null) return null;
        return new MembershipPlanResponse(
                plan.getPlanId(),
                plan.getPlanName(),
                plan.getDescription(),
                plan.getDurationInDays(),
                plan.getPrice(),
                plan.getActive(),
                plan.getCreatedAt()
        );
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
