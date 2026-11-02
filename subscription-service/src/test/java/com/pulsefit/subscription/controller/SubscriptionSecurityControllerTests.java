package com.pulsefit.subscription.controller;

import com.pulsefit.subscription.client.MemberClient;
import com.pulsefit.subscription.security.JwtUtil;
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
        "spring.datasource.url=jdbc:h2:mem:subscriptionsecuritydb;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "jwt.secret=PulseFitSuperSecretKeyForJWTHMACSHA256EnterpriseSecurity2024!"
})
@AutoConfigureMockMvc
class SubscriptionSecurityControllerTests {

    private static final String CORRECT_SECRET = "PulseFitSuperSecretKeyForJWTHMACSHA256EnterpriseSecurity2024!";
    private static final String WRONG_SECRET = "WrongUntrustedForeignSecretKeyForTestingInvalidSignature2024!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @MockBean
    private MemberClient memberClient;

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
    @DisplayName("1. Missing token on /api/subscriptions -> HTTP 401 Unauthorized")
    void testMissingTokenOnSubscriptionsReturns401() throws Exception {
        mockMvc.perform(get("/api/subscriptions"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("2. Missing token on /api/plans -> HTTP 401 Unauthorized")
    void testMissingTokenOnPlansReturns401() throws Exception {
        mockMvc.perform(get("/api/plans"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("3. Invalid/Malformed token -> HTTP 401 Unauthorized")
    void testInvalidTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/plans")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer invalid.malformed.jwt.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("4. Expired token -> HTTP 401 Unauthorized")
    void testExpiredTokenReturns401() throws Exception {
        String expiredToken = createToken("alex", "MEMBER", -3600000, CORRECT_SECRET);

        mockMvc.perform(get("/api/plans")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("5. Valid ADMIN token -> Permitted authenticated access (HTTP 200)")
    void testValidAdminTokenPermitted() throws Exception {
        String adminToken = createToken("admin", "ADMIN", 3600000, CORRECT_SECRET);

        mockMvc.perform(get("/api/plans")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("6. Valid MEMBER token -> Permitted authenticated access to plans (HTTP 200)")
    void testValidMemberTokenPermitted() throws Exception {
        String memberToken = createToken("alex", "MEMBER", 3600000, CORRECT_SECRET);

        mockMvc.perform(get("/api/plans")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + memberToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("7. Invalid signature (signed with different key) -> HTTP 401 Unauthorized")
    void testInvalidSignatureReturns401() throws Exception {
        String tamperedToken = createToken("attacker", "ADMIN", 3600000, WRONG_SECRET);

        mockMvc.perform(get("/api/plans")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("8. Public infrastructure actuator endpoint is accessible without token (HTTP 200)")
    void testActuatorHealthIsPermittedWithoutToken() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Autowired
    private com.pulsefit.subscription.repository.MembershipPlanRepository planRepository;

    @Autowired
    private com.pulsefit.subscription.repository.SubscriptionRepository subscriptionRepository;

    @Test
    @DisplayName("9. RBAC: MEMBER role cannot create a plan -> HTTP 403 Forbidden")
    void testMemberCannotCreatePlanReturns403() throws Exception {
        String memberToken = createToken("alex_member", "MEMBER", 3600000, CORRECT_SECRET);
        String planJson = "{\"planName\":\"Member Plan Test\",\"description\":\"Test\",\"durationInDays\":30,\"price\":29.99,\"active\":true}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/plans")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(planJson)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + memberToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("10. RBAC: MEMBER role cannot delete a plan -> HTTP 403 Forbidden")
    void testMemberCannotDeletePlanReturns403() throws Exception {
        String memberToken = createToken("alex_member", "MEMBER", 3600000, CORRECT_SECRET);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/plans/1")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + memberToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("11. RBAC: ADMIN role can create and delete plans -> HTTP 201 and 200")
    void testAdminCanCreateAndDeletePlan() throws Exception {
        String adminToken = createToken("admin_user", "ADMIN", 3600000, CORRECT_SECRET);
        String planJson = "{\"planName\":\"Admin Special Plan\",\"description\":\"Created by admin\",\"durationInDays\":60,\"price\":79.99,\"active\":true}";

        org.springframework.test.web.servlet.MvcResult result = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/plans")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(planJson)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.planName").value("Admin Special Plan"))
                .andReturn();

        com.fasterxml.jackson.databind.JsonNode rootNode = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(result.getResponse().getContentAsString());
        long createdPlanId = rootNode.get("planId").asLong();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/plans/" + createdPlanId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Membership plan safely deactivated"));
    }

    @Test
    @DisplayName("12. RBAC: STAFF role can create and delete plans -> HTTP 201 and 200")
    void testStaffCanCreateAndDeletePlan() throws Exception {
        String staffToken = createToken("staff_user", "STAFF", 3600000, CORRECT_SECRET);
        String planJson = "{\"planName\":\"Staff Special Plan\",\"description\":\"Created by staff\",\"durationInDays\":45,\"price\":59.99,\"active\":true}";

        org.springframework.test.web.servlet.MvcResult result = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/plans")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(planJson)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staffToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.planName").value("Staff Special Plan"))
                .andReturn();

        com.fasterxml.jackson.databind.JsonNode rootNode = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(result.getResponse().getContentAsString());
        long createdPlanId = rootNode.get("planId").asLong();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/plans/" + createdPlanId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Membership plan safely deactivated"));
    }

    @Test
    @DisplayName("13. RBAC: MEMBER role cannot delete a subscription -> HTTP 403 Forbidden")
    void testMemberCannotDeleteSubscriptionReturns403() throws Exception {
        String memberToken = createToken("alex_member", "MEMBER", 3600000, CORRECT_SECRET);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/subscriptions/1")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + memberToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("14. RBAC: STAFF role can delete a subscription -> HTTP 204 No Content")
    void testStaffCanDeleteSubscriptionReturns204() throws Exception {
        com.pulsefit.subscription.entity.Subscription sub = subscriptionRepository.save(
                new com.pulsefit.subscription.entity.Subscription(99L, 1L, java.time.LocalDate.now(), java.time.LocalDate.now().plusDays(30)));
        String staffToken = createToken("staff_user", "STAFF", 3600000, CORRECT_SECRET);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/subscriptions/" + sub.getSubscriptionId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staffToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("15. RBAC: ADMIN role can delete a subscription -> HTTP 204 No Content")
    void testAdminCanDeleteSubscriptionReturns204() throws Exception {
        com.pulsefit.subscription.entity.Subscription sub = subscriptionRepository.save(
                new com.pulsefit.subscription.entity.Subscription(98L, 1L, java.time.LocalDate.now(), java.time.LocalDate.now().plusDays(30)));
        String adminToken = createToken("admin_user", "ADMIN", 3600000, CORRECT_SECRET);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/subscriptions/" + sub.getSubscriptionId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("16. RBAC: Forged client headers (X-User-Role: ROLE_ADMIN) cannot bypass MEMBER JWT -> HTTP 403 Forbidden")
    void testForgedHeaderWithMemberTokenCannotCreatePlan() throws Exception {
        String memberToken = createToken("alex_member", "MEMBER", 3600000, CORRECT_SECRET);
        String planJson = "{\"planName\":\"Forged Plan Test\",\"description\":\"Spoofed\",\"durationInDays\":30,\"price\":29.99,\"active\":true}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/plans")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(planJson)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + memberToken)
                        .header("X-User-Role", "ROLE_ADMIN")
                        .header("X-User-Name", "admin"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("17. BOLA: MEMBER 1 can retrieve Member 1's subscriptions -> HTTP 200 OK")
    void testMemberCanRetrieveOwnSubscriptionsReturns200() throws Exception {
        subscriptionRepository.save(new com.pulsefit.subscription.entity.Subscription(101L, 1L, java.time.LocalDate.now(), java.time.LocalDate.now().plusDays(30)));
        String member1Token = createToken("member_alex", "MEMBER", 3600000, CORRECT_SECRET, 101L);

        mockMvc.perform(get("/api/subscriptions/member/101")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + member1Token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("18. BOLA: MEMBER 1 cannot retrieve Member 2's subscriptions -> HTTP 403 Forbidden")
    void testMemberCannotRetrieveOtherMemberSubscriptionsReturns403() throws Exception {
        subscriptionRepository.save(new com.pulsefit.subscription.entity.Subscription(102L, 1L, java.time.LocalDate.now(), java.time.LocalDate.now().plusDays(30)));
        String member1Token = createToken("member_alex", "MEMBER", 3600000, CORRECT_SECRET, 101L);

        mockMvc.perform(get("/api/subscriptions/member/102")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + member1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("19. BOLA: MEMBER 1 can retrieve Member 1's active subscription -> HTTP 200 OK")
    void testMemberCanRetrieveOwnActiveSubscriptionReturns200() throws Exception {
        subscriptionRepository.save(new com.pulsefit.subscription.entity.Subscription(103L, 1L, java.time.LocalDate.now(), java.time.LocalDate.now().plusDays(30)));
        String member1Token = createToken("member_alex", "MEMBER", 3600000, CORRECT_SECRET, 103L);

        mockMvc.perform(get("/api/subscriptions/member/103/active")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + member1Token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("20. BOLA: MEMBER 1 cannot retrieve Member 2's active subscription -> HTTP 403 Forbidden")
    void testMemberCannotRetrieveOtherMemberActiveSubscriptionReturns403() throws Exception {
        subscriptionRepository.save(new com.pulsefit.subscription.entity.Subscription(104L, 1L, java.time.LocalDate.now(), java.time.LocalDate.now().plusDays(30)));
        String member1Token = createToken("member_alex", "MEMBER", 3600000, CORRECT_SECRET, 103L);

        mockMvc.perform(get("/api/subscriptions/member/104/active")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + member1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("21. BOLA: MEMBER without memberId claim cannot access subscriptions -> HTTP 403 Forbidden")
    void testMemberWithoutMemberIdClaimCannotAccessSubscriptionsReturns403() throws Exception {
        String unmappedToken = createToken("member_unmapped", "MEMBER", 3600000, CORRECT_SECRET, null);

        mockMvc.perform(get("/api/subscriptions/member/101")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + unmappedToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("22. BOLA: ADMIN and STAFF can retrieve any member's subscriptions -> HTTP 200 OK")
    void testAdminAndStaffCanRetrieveAnyMemberSubscriptions() throws Exception {
        String adminToken = createToken("admin_user", "ADMIN", 3600000, CORRECT_SECRET, null);
        String staffToken = createToken("staff_user", "STAFF", 3600000, CORRECT_SECRET, null);

        mockMvc.perform(get("/api/subscriptions/member/101")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/subscriptions/member/101")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staffToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("23. BOLA: MEMBER 1 cannot create subscription for Member 2 -> HTTP 403 Forbidden")
    void testMemberCannotCreateSubscriptionForOtherMemberReturns403() throws Exception {
        String member1Token = createToken("member_alex", "MEMBER", 3600000, CORRECT_SECRET, 101L);
        String createJson = "{\"memberId\":102,\"planId\":1,\"startDate\":\"2026-11-02\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/subscriptions")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(createJson)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + member1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }
}
