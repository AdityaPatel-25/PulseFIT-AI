package com.pulsefit.attendance.controller;

import com.pulsefit.attendance.client.MemberClient;
import com.pulsefit.attendance.client.SubscriptionClient;
import com.pulsefit.attendance.security.JwtUtil;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:attendancesecuritydb;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "jwt.secret=PulseFitSuperSecretKeyForJWTHMACSHA256EnterpriseSecurity2024!"
})
@AutoConfigureMockMvc
class AttendanceSecurityControllerTests {

    private static final String CORRECT_SECRET = "PulseFitSuperSecretKeyForJWTHMACSHA256EnterpriseSecurity2024!";
    private static final String WRONG_SECRET = "WrongUntrustedForeignSecretKeyForTestingInvalidSignature2024!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @MockBean
    private MemberClient memberClient;

    @MockBean
    private SubscriptionClient subscriptionClient;

    private String createToken(String username, String role, long expirationOffsetMs, String secret) {
        return createToken(username, role, expirationOffsetMs, secret, null);
    }

    private String createToken(String username, String role, long expirationOffsetMs, String secret, Long memberId) {
        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationOffsetMs);

        var builder = Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .claim("email", username + "@pulsefit.com");

        if (memberId != null) {
            builder.claim("memberId", memberId);
        }

        return builder
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    @Test
    @DisplayName("1. Missing token on /api/attendance -> HTTP 401 Unauthorized")
    void testMissingTokenOnAttendanceReturns401() throws Exception {
        mockMvc.perform(get("/api/attendance/recent"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("2. Invalid/Malformed token -> HTTP 401 Unauthorized")
    void testInvalidTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/attendance/recent")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer invalid.malformed.jwt.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("3. Expired token -> HTTP 401 Unauthorized")
    void testExpiredTokenReturns401() throws Exception {
        String expiredToken = createToken("alex", "MEMBER", -3600000, CORRECT_SECRET);

        mockMvc.perform(get("/api/attendance/recent")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("4. Valid ADMIN token -> Permitted authenticated access (HTTP 200)")
    void testValidAdminTokenPermitted() throws Exception {
        String adminToken = createToken("admin", "ADMIN", 3600000, CORRECT_SECRET);

        mockMvc.perform(get("/api/attendance/recent")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("5. Valid MEMBER token -> Permitted authenticated access (HTTP 200)")
    void testValidMemberTokenPermitted() throws Exception {
        String memberToken = createToken("alex", "MEMBER", 3600000, CORRECT_SECRET);

        mockMvc.perform(get("/api/attendance/recent")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + memberToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("6. Invalid signature (signed with different key) -> HTTP 401 Unauthorized")
    void testInvalidSignatureReturns401() throws Exception {
        String tamperedToken = createToken("attacker", "ADMIN", 3600000, WRONG_SECRET);

        mockMvc.perform(get("/api/attendance/recent")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("7. Public infrastructure actuator endpoint is accessible without token (HTTP 200)")
    void testActuatorHealthIsPermittedWithoutToken() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("8. RBAC: MEMBER role cannot access fraud alerts -> HTTP 403 Forbidden")
    void testMemberCannotAccessFraudAlertsReturns403() throws Exception {
        String memberToken = createToken("alex_member", "MEMBER", 3600000, CORRECT_SECRET);

        mockMvc.perform(get("/api/attendance/ai/fraud-alerts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + memberToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("9. RBAC: STAFF role can access fraud alerts -> HTTP 200 OK")
    void testStaffCanAccessFraudAlertsReturns200() throws Exception {
        String staffToken = createToken("staff_user", "STAFF", 3600000, CORRECT_SECRET);

        mockMvc.perform(get("/api/attendance/ai/fraud-alerts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staffToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("10. RBAC: ADMIN role can access fraud alerts -> HTTP 200 OK")
    void testAdminCanAccessFraudAlertsReturns200() throws Exception {
        String adminToken = createToken("admin_user", "ADMIN", 3600000, CORRECT_SECRET);

        mockMvc.perform(get("/api/attendance/ai/fraud-alerts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("11. RBAC: MEMBER role cannot invoke tailgate check -> HTTP 403 Forbidden")
    void testMemberCannotInvokeTailgateCheckReturns403() throws Exception {
        String memberToken = createToken("alex_member", "MEMBER", 3600000, CORRECT_SECRET);
        String body = "{\"memberId\":1,\"facilityId\":\"FAC-01\",\"gateId\":\"GATE-01\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/attendance/ai/tailgate-check")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(body)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + memberToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("12. RBAC: STAFF role can invoke tailgate check -> HTTP 200 OK")
    void testStaffCanInvokeTailgateCheckReturns200() throws Exception {
        String staffToken = createToken("staff_user", "STAFF", 3600000, CORRECT_SECRET);
        String body = "{\"memberId\":1,\"facilityId\":\"FAC-01\",\"gateId\":\"GATE-01\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/attendance/ai/tailgate-check")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(body)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staffToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("13. RBAC: Forged client headers (X-User-Role: ROLE_ADMIN) cannot bypass MEMBER JWT -> HTTP 403 Forbidden")
    void testForgedHeaderWithMemberTokenCannotAccessFraudAlerts() throws Exception {
        String memberToken = createToken("alex_member", "MEMBER", 3600000, CORRECT_SECRET);

        mockMvc.perform(get("/api/attendance/ai/fraud-alerts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + memberToken)
                        .header("X-User-Role", "ROLE_ADMIN")
                        .header("X-User-Name", "admin"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("14. BOLA: MEMBER 1 can retrieve Member 1's attendance history -> HTTP 200 OK")
    void testMemberCanRetrieveOwnAttendanceReturns200() throws Exception {
        String member1Token = createToken("member_alex", "MEMBER", 3600000, CORRECT_SECRET, 1L);

        mockMvc.perform(get("/api/attendance/member/1")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + member1Token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("15. BOLA: MEMBER 1 cannot retrieve Member 2's attendance history -> HTTP 403 Forbidden")
    void testMemberCannotRetrieveOtherMemberAttendanceReturns403() throws Exception {
        String member1Token = createToken("member_alex", "MEMBER", 3600000, CORRECT_SECRET, 1L);

        mockMvc.perform(get("/api/attendance/member/2")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + member1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("16. BOLA: MEMBER without memberId claim cannot access attendance -> HTTP 403 Forbidden")
    void testMemberWithoutMemberIdClaimCannotAccessAttendanceReturns403() throws Exception {
        String unmappedToken = createToken("member_unmapped", "MEMBER", 3600000, CORRECT_SECRET, null);

        mockMvc.perform(get("/api/attendance/member/1")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + unmappedToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("17. BOLA: ADMIN can retrieve any member's attendance history -> HTTP 200 OK")
    void testAdminCanRetrieveAnyMemberAttendanceReturns200() throws Exception {
        String adminToken = createToken("admin_user", "ADMIN", 3600000, CORRECT_SECRET, null);

        mockMvc.perform(get("/api/attendance/member/2")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("18. BOLA: STAFF can retrieve any member's attendance history -> HTTP 200 OK")
    void testStaffCanRetrieveAnyMemberAttendanceReturns200() throws Exception {
        String staffToken = createToken("staff_user", "STAFF", 3600000, CORRECT_SECRET, null);

        mockMvc.perform(get("/api/attendance/member/2")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staffToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("19. BOLA: MEMBER 1 cannot check in for Member 2 -> HTTP 403 Forbidden")
    void testMemberCannotCheckInForOtherMemberReturns403() throws Exception {
        String member1Token = createToken("member_alex", "MEMBER", 3600000, CORRECT_SECRET, 1L);
        String checkInJson = "{\"memberId\":2,\"facilityId\":\"FAC-01\",\"facilityName\":\"Main Facility\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/attendance/check-in")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(checkInJson)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + member1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }
}
