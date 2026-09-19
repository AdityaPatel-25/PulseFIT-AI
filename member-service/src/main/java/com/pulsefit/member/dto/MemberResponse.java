package com.pulsefit.member.dto;

import com.pulsefit.member.model.Member;
import java.time.LocalDateTime;

public class MemberResponse {
    private Long memberId;
    private String name;
    private String contact;
    private String email;
    private String address;
    private String emergencyContact;
    private String status;
    private LocalDateTime createdAt;

    public MemberResponse() {}

    public MemberResponse(Long memberId, String name, String contact, String email, String address, String emergencyContact, String status, LocalDateTime createdAt) {
        this.memberId = memberId;
        this.name = name;
        this.contact = contact;
        this.email = email;
        this.address = address;
        this.emergencyContact = emergencyContact;
        this.status = status;
        this.createdAt = createdAt;
    }

    public static MemberResponse fromEntity(Member member) {
        return new MemberResponse(
                member.getMemberId(),
                member.getName(),
                member.getContact(),
                member.getEmail(),
                member.getAddress(),
                member.getEmergencyContact(),
                member.getStatus(),
                member.getCreatedAt()
        );
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
