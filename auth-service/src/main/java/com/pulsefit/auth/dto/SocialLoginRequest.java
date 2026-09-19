package com.pulsefit.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class SocialLoginRequest {

    @NotBlank(message = "Provider is required (e.g. GOOGLE, GITHUB)")
    private String provider;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String name;

    private String role;

    public SocialLoginRequest() {}

    public SocialLoginRequest(String provider, String email, String name, String role) {
        this.provider = provider;
        this.email = email;
        this.name = name;
        this.role = role;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
