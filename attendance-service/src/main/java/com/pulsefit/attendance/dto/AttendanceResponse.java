package com.pulsefit.attendance.dto;

import com.pulsefit.attendance.model.Attendance;
import java.time.LocalDateTime;

public class AttendanceResponse {
    private Long attendanceId;
    private Long memberId;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private String facilityId;
    private String facilityName;
    private String accessStatus;
    private String denialReason;

    public AttendanceResponse() {}

    public static AttendanceResponse fromEntity(Attendance a) {
        AttendanceResponse res = new AttendanceResponse();
        res.setAttendanceId(a.getAttendanceId());
        res.setMemberId(a.getMemberId());
        res.setCheckInTime(a.getCheckInTime());
        res.setCheckOutTime(a.getCheckOutTime());
        res.setFacilityId(a.getFacilityId());
        res.setFacilityName(a.getFacilityName());
        res.setAccessStatus(a.getAccessStatus());
        res.setDenialReason(a.getDenialReason());
        return res;
    }

    public Long getAttendanceId() {
        return attendanceId;
    }

    public void setAttendanceId(Long attendanceId) {
        this.attendanceId = attendanceId;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public LocalDateTime getCheckInTime() {
        return checkInTime;
    }

    public void setCheckInTime(LocalDateTime checkInTime) {
        this.checkInTime = checkInTime;
    }

    public LocalDateTime getCheckOutTime() {
        return checkOutTime;
    }

    public void setCheckOutTime(LocalDateTime checkOutTime) {
        this.checkOutTime = checkOutTime;
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

    public String getAccessStatus() {
        return accessStatus;
    }

    public void setAccessStatus(String accessStatus) {
        this.accessStatus = accessStatus;
    }

    public String getDenialReason() {
        return denialReason;
    }

    public void setDenialReason(String denialReason) {
        this.denialReason = denialReason;
    }
}
