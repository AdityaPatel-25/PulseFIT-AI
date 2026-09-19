package com.pulsefit.gateway;

import com.pulsefit.gateway.filter.JwtUtil;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ApiGatewayApplicationTests {

    @Test
    void testJwtValidationLogic() {
        JwtUtil jwtUtil = new JwtUtil("PulseFitSuperSecretKeyForJWTHMACSHA256EnterpriseSecurity2024!");
        assertFalse(jwtUtil.validateToken("invalid.jwt.token"));
    }
}
