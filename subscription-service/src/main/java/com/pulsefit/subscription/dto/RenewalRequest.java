package com.pulsefit.subscription.dto;

public class RenewalRequest {
    private Integer extensionMonths; // e.g. 1, 3, 6, 12 months
    private String updatedPlanType; // optional upgrade
    private Double renewalPrice;

    public RenewalRequest() {}

    public RenewalRequest(Integer extensionMonths, String updatedPlanType, Double renewalPrice) {
        this.extensionMonths = extensionMonths;
        this.updatedPlanType = updatedPlanType;
        this.renewalPrice = renewalPrice;
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
