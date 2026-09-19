package com.pulsefit.attendance.dto;

import jakarta.validation.constraints.NotNull;

public class CheckOutRequest {

    @NotNull(message = "Member ID is required")
    private Long memberId;

    private Long attendanceId; // Optional, if omitted the latest active check-in is used

    public CheckOutRequest() {}

    public CheckOutRequest(Long memberId, Long attendanceId) {
        this.memberId = memberId;
        this.attendanceId = attendanceId;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public Long getAttendanceId() {
        return attendanceId;
    }

    public void setAttendanceId(Long attendanceId) {
        this.attendanceId = attendanceId;
    }
}
