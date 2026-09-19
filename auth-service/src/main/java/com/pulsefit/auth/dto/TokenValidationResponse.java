package com.pulsefit.auth.dto;

public class TokenValidationResponse {
    private boolean valid;
    private String username;
    private String role;
    private String error;

    public TokenValidationResponse() {}

    public TokenValidationResponse(boolean valid, String username, String role, String error) {
        this.valid = valid;
        this.username = username;
        this.role = role;
        this.error = error;
    }

    public static TokenValidationResponse success(String username, String role) {
        return new TokenValidationResponse(true, username, role, null);
    }

    public static TokenValidationResponse failure(String error) {
        return new TokenValidationResponse(false, null, null, error);
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
