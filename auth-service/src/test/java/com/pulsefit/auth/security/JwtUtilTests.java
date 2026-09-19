package com.pulsefit.auth.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTests {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil("PulseFitSuperSecretKeyForJWTHMACSHA256EnterpriseSecurity2024!", 3600000);
    }

    @Test
    void testGenerateAndValidateToken() {
        String token = jwtUtil.generateToken("testuser", "ROLE_MEMBER", "test@pulsefit.com");
        assertNotNull(token);
        assertTrue(jwtUtil.validateToken(token));
        assertEquals("testuser", jwtUtil.extractUsername(token));
        assertEquals("ROLE_MEMBER", jwtUtil.extractRole(token));
        assertEquals("test@pulsefit.com", jwtUtil.extractEmail(token));
    }

    @Test
    void testInvalidToken() {
        assertFalse(jwtUtil.validateToken("invalid.token.string"));
    }
}
