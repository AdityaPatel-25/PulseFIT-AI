package com.pulsefit.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CheckInRequest {

    @NotNull(message = "Member ID is required")
    private Long memberId;

    @NotBlank(message = "Facility ID is required")
    private String facilityId;

    private String facilityName;

    public CheckInRequest() {}

    public CheckInRequest(Long memberId, String facilityId, String facilityName) {
        this.memberId = memberId;
        this.facilityId = facilityId;
        this.facilityName = facilityName;
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

    public String getFacilityName() {
        return facilityName;
    }

    public void setFacilityName(String facilityName) {
        this.facilityName = facilityName;
    }
}
