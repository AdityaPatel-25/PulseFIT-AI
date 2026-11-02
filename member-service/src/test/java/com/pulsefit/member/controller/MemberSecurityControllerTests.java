package com.pulsefit.member.controller;

import com.pulsefit.member.security.JwtUtil;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
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
        "spring.datasource.url=jdbc:h2:mem:membersecuritydb;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "jwt.secret=PulseFitSuperSecretKeyForJWTHMACSHA256EnterpriseSecurity2024!"
})
@AutoConfigureMockMvc
class MemberSecurityControllerTests {

    private static final String CORRECT_SECRET = "PulseFitSuperSecretKeyForJWTHMACSHA256EnterpriseSecurity2024!";
    private static final String WRONG_SECRET = "WrongUntrustedForeignSecretKeyForTestingInvalidSignature2024!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private com.pulsefit.member.repository.MemberRepository memberRepository;

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
    @DisplayName("1. Missing token -> HTTP 401 Unauthorized")
    void testMissingTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/members"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("2. Invalid/Malformed token -> HTTP 401 Unauthorized")
    void testInvalidTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/members")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer invalid.malformed.jwt.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("3. Expired token -> HTTP 401 Unauthorized")
    void testExpiredTokenReturns401() throws Exception {
        String expiredToken = createToken("alex", "MEMBER", -3600000, CORRECT_SECRET);

        mockMvc.perform(get("/api/members")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("4. Valid ADMIN token -> Permitted authenticated access (HTTP 200)")
    void testValidAdminTokenPermitted() throws Exception {
        String adminToken = createToken("admin", "ADMIN", 3600000, CORRECT_SECRET);

        mockMvc.perform(get("/api/members")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("5. Valid MEMBER token -> Permitted authenticated access to ordinary endpoints (HTTP 200)")
    void testValidMemberTokenPermitted() throws Exception {
        String memberToken = createToken("alex", "MEMBER", 3600000, CORRECT_SECRET);

        mockMvc.perform(get("/api/members")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + memberToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("6. Invalid signature (signed with different key) -> HTTP 401 Unauthorized")
    void testInvalidSignatureReturns401() throws Exception {
        String tamperedToken = createToken("attacker", "ADMIN", 3600000, WRONG_SECRET);

        mockMvc.perform(get("/api/members")
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
    @DisplayName("8. RBAC: MEMBER role cannot delete a member -> HTTP 403 Forbidden")
    void testMemberCannotDeleteMemberReturns403() throws Exception {
        com.pulsefit.member.model.Member m = memberRepository.save(
                new com.pulsefit.member.model.Member("User For Delete Test", "+1001", "del1@p.com", "Addr", "+2001"));
        String memberToken = createToken("member_user", "MEMBER", 3600000, CORRECT_SECRET);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/members/" + m.getMemberId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + memberToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("9. RBAC: STAFF role cannot delete a member -> HTTP 403 Forbidden")
    void testStaffCannotDeleteMemberReturns403() throws Exception {
        com.pulsefit.member.model.Member m = memberRepository.save(
                new com.pulsefit.member.model.Member("User For Staff Del Test", "+1002", "del2@p.com", "Addr", "+2002"));
        String staffToken = createToken("staff_user", "STAFF", 3600000, CORRECT_SECRET);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/members/" + m.getMemberId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staffToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("10. RBAC: ADMIN role can delete a member -> HTTP 200 OK")
    void testAdminCanDeleteMemberReturns200() throws Exception {
        com.pulsefit.member.model.Member m = memberRepository.save(
                new com.pulsefit.member.model.Member("User For Admin Del Test", "+1003", "del3@p.com", "Addr", "+2003"));
        String adminToken = createToken("admin_user", "ADMIN", 3600000, CORRECT_SECRET);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/members/" + m.getMemberId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Member successfully deleted"));
    }

    @Test
    @DisplayName("11. RBAC: Forged client headers (X-User-Role: ROLE_ADMIN) cannot bypass MEMBER JWT -> HTTP 403 Forbidden")
    void testForgedHeaderWithMemberTokenCannotDelete() throws Exception {
        com.pulsefit.member.model.Member m = memberRepository.save(
                new com.pulsefit.member.model.Member("User For Spoof Test", "+1004", "del4@p.com", "Addr", "+2004"));
        String memberToken = createToken("attacker_member", "MEMBER", 3600000, CORRECT_SECRET);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/members/" + m.getMemberId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + memberToken)
                        .header("X-User-Role", "ROLE_ADMIN")
                        .header("X-User-Name", "admin"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("12. RBAC: MEMBER role cannot create a member -> HTTP 403 Forbidden")
    void testMemberCannotCreateMemberReturns403() throws Exception {
        String memberToken = createToken("member_user", "MEMBER", 3600000, CORRECT_SECRET);
        String body = "{\"name\":\"Forbidden Create\",\"contact\":\"+1999888777\",\"email\":\"fcreate@p.com\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/members")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(body)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + memberToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("13. RBAC: STAFF role can create a member -> HTTP 201 Created")
    void testStaffCanCreateMemberReturns201() throws Exception {
        String staffToken = createToken("staff_user", "STAFF", 3600000, CORRECT_SECRET);
        String body = "{\"name\":\"Staff Created Member\",\"contact\":\"+1888777666\",\"email\":\"staffcreate@p.com\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/members")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(body)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staffToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Staff Created Member"));
    }

    @Test
    @DisplayName("14. BOLA: MEMBER 1 can retrieve Member 1's profile -> HTTP 200 OK")
    void testMemberCanRetrieveOwnProfileReturns200() throws Exception {
        com.pulsefit.member.model.Member m1 = memberRepository.save(
                new com.pulsefit.member.model.Member("Alex Mercer", "+1-555-1111", "alex@p.com", "Addr 1", "+1-9999"));
        String member1Token = createToken("member_alex", "MEMBER", 3600000, CORRECT_SECRET, m1.getMemberId());

        mockMvc.perform(get("/api/members/" + m1.getMemberId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + member1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberId").value(m1.getMemberId()))
                .andExpect(jsonPath("$.name").value("Alex Mercer"));
    }

    @Test
    @DisplayName("15. BOLA: MEMBER 1 cannot retrieve Member 2's profile -> HTTP 403 Forbidden")
    void testMemberCannotRetrieveOtherMemberProfileReturns403() throws Exception {
        com.pulsefit.member.model.Member m1 = memberRepository.save(
                new com.pulsefit.member.model.Member("Alex Mercer", "+1-555-1112", "alex2@p.com", "Addr 1", "+1-9999"));
        com.pulsefit.member.model.Member m2 = memberRepository.save(
                new com.pulsefit.member.model.Member("Sarah Connor", "+1-555-2222", "sarah@p.com", "Addr 2", "+1-8888"));

        String member1Token = createToken("member_alex", "MEMBER", 3600000, CORRECT_SECRET, m1.getMemberId());

        mockMvc.perform(get("/api/members/" + m2.getMemberId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + member1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("16. BOLA: MEMBER without memberId claim cannot access member profile -> HTTP 403 Forbidden")
    void testMemberWithoutMemberIdClaimCannotAccessProfileReturns403() throws Exception {
        com.pulsefit.member.model.Member m1 = memberRepository.save(
                new com.pulsefit.member.model.Member("Alex Mercer", "+1-555-1113", "alex3@p.com", "Addr 1", "+1-9999"));
        // Token has role MEMBER but NO memberId claim
        String unmappedMemberToken = createToken("member_unmapped", "MEMBER", 3600000, CORRECT_SECRET, null);

        mockMvc.perform(get("/api/members/" + m1.getMemberId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + unmappedMemberToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("17. BOLA: ADMIN can access any member profile -> HTTP 200 OK")
    void testAdminCanAccessAnyMemberProfileReturns200() throws Exception {
        com.pulsefit.member.model.Member m = memberRepository.save(
                new com.pulsefit.member.model.Member("Target Member", "+1-555-3333", "target@p.com", "Addr 3", "+1-7777"));
        String adminToken = createToken("admin_user", "ADMIN", 3600000, CORRECT_SECRET, null);

        mockMvc.perform(get("/api/members/" + m.getMemberId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberId").value(m.getMemberId()));
    }

    @Test
    @DisplayName("18. BOLA: STAFF can access any member profile -> HTTP 200 OK")
    void testStaffCanAccessAnyMemberProfileReturns200() throws Exception {
        com.pulsefit.member.model.Member m = memberRepository.save(
                new com.pulsefit.member.model.Member("Target Member 2", "+1-555-4444", "target2@p.com", "Addr 4", "+1-6666"));
        String staffToken = createToken("staff_user", "STAFF", 3600000, CORRECT_SECRET, null);

        mockMvc.perform(get("/api/members/" + m.getMemberId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberId").value(m.getMemberId()));
    }

    @Test
    @DisplayName("19. BOLA: Member status check enforces ownership (own: 200, other: 403)")
    void testMemberStatusCheckEnforcesOwnership() throws Exception {
        com.pulsefit.member.model.Member m1 = memberRepository.save(
                new com.pulsefit.member.model.Member("Alex Status", "+1-555-5551", "status1@p.com", "Addr", "+1-5555"));
        com.pulsefit.member.model.Member m2 = memberRepository.save(
                new com.pulsefit.member.model.Member("Other Status", "+1-555-5552", "status2@p.com", "Addr", "+1-4444"));

        String member1Token = createToken("member_alex", "MEMBER", 3600000, CORRECT_SECRET, m1.getMemberId());

        // Own status check -> 200
        mockMvc.perform(get("/api/members/" + m1.getMemberId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + member1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(true));

        // Other status check -> 403
        mockMvc.perform(get("/api/members/" + m2.getMemberId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + member1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }
}
