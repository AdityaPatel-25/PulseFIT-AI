package com.pulsefit.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MemberRequest {

    @NotBlank(message = "Member name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Contact number is required")
    @Size(min = 7, max = 25, message = "Contact must be between 7 and 25 characters")
    private String contact;

    @jakarta.validation.constraints.Email(message = "Email must be a valid email address")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    private String email;

    @Size(max = 255, message = "Address cannot exceed 255 characters")
    private String address;

    @Size(max = 25, message = "Emergency contact cannot exceed 25 characters")
    private String emergencyContact;

    private String status;

    public MemberRequest() {}

    public MemberRequest(String name, String contact, String email, String address, String emergencyContact) {
        this.name = name;
        this.contact = contact;
        this.email = email;
        this.address = address;
        this.emergencyContact = emergencyContact;
    }

    public MemberRequest(String name, String contact, String email, String address, String emergencyContact, String status) {
        this.name = name;
        this.contact = contact;
        this.email = email;
        this.address = address;
        this.emergencyContact = emergencyContact;
        this.status = status;
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
}
