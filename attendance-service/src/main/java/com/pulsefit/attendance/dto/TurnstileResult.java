package com.pulsefit.attendance.dto;

import java.time.LocalDateTime;

public class TurnstileResult {
    private boolean granted;
    private Long memberId;
    private String memberName;
    private String facilityId;
    private String facilityName;
    private Long attendanceId;
    private String message;
    private LocalDateTime timestamp;

    public TurnstileResult() {}

    public static TurnstileResult accessGranted(Long memberId, String memberName, String facilityId, String facilityName, Long attendanceId) {
        TurnstileResult res = new TurnstileResult();
        res.setGranted(true);
        res.setMemberId(memberId);
        res.setMemberName(memberName);
        res.setFacilityId(facilityId);
        res.setFacilityName(facilityName);
        res.setAttendanceId(attendanceId);
        res.setMessage("ACCESS GRANTED - Welcome to " + facilityName + "!");
        res.setTimestamp(LocalDateTime.now());
        return res;
    }

    public static TurnstileResult accessDenied(Long memberId, String memberName, String facilityId, String reason) {
        TurnstileResult res = new TurnstileResult();
        res.setGranted(false);
        res.setMemberId(memberId);
        res.setMemberName(memberName);
        res.setFacilityId(facilityId);
        res.setMessage("ACCESS DENIED: " + reason);
        res.setTimestamp(LocalDateTime.now());
        return res;
    }

    public boolean isGranted() {
        return granted;
    }

    public void setGranted(boolean granted) {
        this.granted = granted;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public String getMemberName() {
        return memberName;
    }

    public void setMemberName(String memberName) {
        this.memberName = memberName;
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

    public Long getAttendanceId() {
        return attendanceId;
    }

    public void setAttendanceId(Long attendanceId) {
        this.attendanceId = attendanceId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
