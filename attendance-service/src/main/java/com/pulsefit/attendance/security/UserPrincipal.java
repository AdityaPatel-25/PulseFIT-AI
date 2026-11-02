package com.pulsefit.attendance.security;

import java.io.Serializable;
import java.security.Principal;

/**
 * Verified user principal containing cryptographically authenticated identity and member linkage.
 */
public class UserPrincipal implements Principal, Serializable {

    private final String username;
    private final String role;
    private final Long memberId;

    public UserPrincipal(String username, String role, Long memberId) {
        this.username = username;
        this.role = role;
        this.memberId = memberId;
    }

    @Override
    public String getName() {
        return username;
    }

    public String getUsername() {
        return username;
    }

    public String getRole() {
        return role;
    }

    public Long getMemberId() {
        return memberId;
    }

    @Override
    public String toString() {
        return username;
    }
}
