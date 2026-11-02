package com.pulsefit.subscription.dto;

public class RenewalRequest {

    private Long planId; // Optional: specify a plan to renew with
    private Integer extensionDays; // Optional: explicit days
    private Integer extensionMonths; // Optional: extension months
    private String updatedPlanType; // Optional
    private Double renewalPrice; // Optional

    public RenewalRequest() {}

    public RenewalRequest(Long planId) {
        this.planId = planId;
    }

    public RenewalRequest(Integer extensionMonths, String updatedPlanType, Double renewalPrice) {
        this.extensionMonths = extensionMonths;
        this.updatedPlanType = updatedPlanType;
        this.renewalPrice = renewalPrice;
    }

    public Long getPlanId() {
        return planId;
    }

    public void setPlanId(Long planId) {
        this.planId = planId;
    }

    public Integer getExtensionDays() {
        return extensionDays;
    }

    public void setExtensionDays(Integer extensionDays) {
        this.extensionDays = extensionDays;
    }

    public Integer getExtensionMonths() {
        return extensionMonths;
    }

    public void setExtensionMonths(Integer extensionMonths) {
        this.extensionMonths = extensionMonths;
    }

    public String getUpdatedPlanType() {
        return updatedPlanType;
    }

    public void setUpdatedPlanType(String updatedPlanType) {
        this.updatedPlanType = updatedPlanType;
    }

    public Double getRenewalPrice() {
        return renewalPrice;
    }

    public void setRenewalPrice(Double renewalPrice) {
        this.renewalPrice = renewalPrice;
    }
}
