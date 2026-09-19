package com.pulsefit.attendance.dto;

import jakarta.validation.constraints.NotNull;

public class TailgateCheckRequest {

    @NotNull(message = "memberId is required")
    private Long memberId;

    @NotNull(message = "facilityId is required")
    private String facilityId;

    private String gateId;

    public TailgateCheckRequest() {}

    public TailgateCheckRequest(Long memberId, String facilityId, String gateId) {
        this.memberId = memberId;
        this.facilityId = facilityId;
        this.gateId = gateId;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public String getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(String facilityId) {
        this.facilityId = facilityId;
    }

    public String getGateId() {
        return gateId;
    }

    public void setGateId(String gateId) {
        this.gateId = gateId;
    }
}
