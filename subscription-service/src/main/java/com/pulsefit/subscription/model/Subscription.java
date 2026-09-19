package com.pulsefit.subscription.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscription")
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "subscription_id")
    private Long subscriptionId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "plan_type", nullable = false, length = 50)
    private String planType; // BASIC_MONTHLY, PREMIUM_QUARTERLY, ALL_ACCESS_ANNUAL

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, EXPIRED, CANCELLED

    @Column(name = "facility_tier", length = 30)
    private String facilityTier = "MULTI_FACILITY"; // SINGLE_FACILITY, MULTI_FACILITY

    @Column(name = "price")
    private Double price;

    @Column(name = "auto_renew")
    private Boolean autoRenew = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Subscription() {}

    public Subscription(Long memberId, String planType, LocalDate startDate, LocalDate expiryDate, String facilityTier, Double price, Boolean autoRenew) {
        this.memberId = memberId;
        this.planType = planType;
        this.startDate = startDate;
        this.expiryDate = expiryDate;
        this.status = "ACTIVE";
        this.facilityTier = facilityTier != null ? facilityTier : "MULTI_FACILITY";
        this.price = price;
        this.autoRenew = autoRenew != null ? autoRenew : false;
        this.createdAt = LocalDateTime.now();
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
