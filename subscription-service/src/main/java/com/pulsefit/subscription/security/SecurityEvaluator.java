package com.pulsefit.subscription.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Enforces Object-Level Authorization (BOLA/IDOR protection).
 * Ensures ROLE_ADMIN and ROLE_STAFF retain administrative access,
 * while ROLE_MEMBER can only access subscriptions strictly belonging to their verified member identity.
 */
@Component("securityEvaluator")
public class SecurityEvaluator {

    private static final Logger log = LoggerFactory.getLogger(SecurityEvaluator.class);

    public boolean canAccessMember(Long targetMemberId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            log.warn("Access denied: request is unauthenticated");
            return false;
        }

        boolean isStaffOrAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()) || "ROLE_STAFF".equals(a.getAuthority()));
        if (isStaffOrAdmin) {
            return true;
        }

        boolean isMember = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_MEMBER".equals(a.getAuthority()));
        if (!isMember) {
            log.warn("Access denied: principal has neither staff/admin nor member role");
            return false;
        }

        Long tokenMemberId = extractMemberId(auth);
        if (tokenMemberId == null) {
            log.warn("BOLA rejection: MEMBER principal '{}' has no verified memberId claim", auth.getName());
            return false;
        }

        if (targetMemberId == null) {
            log.warn("BOLA rejection: target member ID is null");
            return false;
        }

        boolean match = tokenMemberId.equals(targetMemberId);
        if (!match) {
            log.warn("BOLA IDOR prevented: authenticated member ID {} attempted to access subscription of member ID {}",
                    tokenMemberId, targetMemberId);
        }
        return match;
    }

    public Long extractMemberId(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
            return ((UserPrincipal) auth.getPrincipal()).getMemberId();
        }
        return null;
    }
}
