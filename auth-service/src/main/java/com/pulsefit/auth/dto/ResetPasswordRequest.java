package com.pulsefit.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ResetPasswordRequest {

    @NotBlank(message = "Username or email is required")
    private String identifier;

    @NotBlank(message = "New password is required")
    @Size(min = 4, message = "Password must be at least 4 characters")
    private String newPassword;

    public ResetPasswordRequest() {}

    public ResetPasswordRequest(String identifier, String newPassword) {
        this.identifier = identifier;
        this.newPassword = newPassword;
    }

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
