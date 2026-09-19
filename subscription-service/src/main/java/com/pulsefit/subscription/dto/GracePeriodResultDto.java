package com.pulsefit.subscription.dto;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class GracePeriodResultDto {

    private boolean granted;
    private Long subscriptionId;
    private Long memberId;
    private String message;
    private String temporaryPassExpiry;
    private boolean paymentActionRequired;
    private String notificationChannel;

    public GracePeriodResultDto() {}

    public GracePeriodResultDto(boolean granted, Long subscriptionId, Long memberId,
                                String message, LocalDateTime expiry, boolean paymentActionRequired) {
        this.granted = granted;
        this.subscriptionId = subscriptionId;
        this.memberId = memberId;
        this.message = message;
        this.temporaryPassExpiry = expiry != null ? expiry.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : null;
        this.paymentActionRequired = paymentActionRequired;
        this.notificationChannel = "SMS & Mobile Push Notification Dispatched";
    }

    public boolean isGranted() {
        return granted;
    }

    public void setGranted(boolean granted) {
        this.granted = granted;
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

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getTemporaryPassExpiry() {
        return temporaryPassExpiry;
    }

    public void setTemporaryPassExpiry(String temporaryPassExpiry) {
        this.temporaryPassExpiry = temporaryPassExpiry;
    }

    public boolean isPaymentActionRequired() {
        return paymentActionRequired;
    }

    public void setPaymentActionRequired(boolean paymentActionRequired) {
        this.paymentActionRequired = paymentActionRequired;
    }

    public String getNotificationChannel() {
        return notificationChannel;
    }

    public void setNotificationChannel(String notificationChannel) {
        this.notificationChannel = notificationChannel;
    }
}
