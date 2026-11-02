package com.pulsefit.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pulsefit.auth.dto.ChangePasswordRequest;
import com.pulsefit.auth.dto.ResetPasswordRequest;
import com.pulsefit.auth.model.User;
import com.pulsefit.auth.repository.UserRepository;
import com.pulsefit.auth.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:authsecuritydb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
class AuthSecurityControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private ObjectMapper objectMapper = new ObjectMapper();

    private String adminToken;
    private String memberToken;
    private String staffToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        User admin = new User("adminUser", passwordEncoder.encode("adminPass123"), "admin@pulsefit.com", "ROLE_ADMIN");
        User member = new User("memberUser", passwordEncoder.encode("memberPass123"), "member@pulsefit.com", "ROLE_MEMBER");
        User staff = new User("staffUser", passwordEncoder.encode("staffPass123"), "staff@pulsefit.com", "ROLE_STAFF");
        userRepository.saveAll(List.of(admin, member, staff));

        adminToken = jwtUtil.generateToken("adminUser", "ROLE_ADMIN", "admin@pulsefit.com");
        memberToken = jwtUtil.generateToken("memberUser", "ROLE_MEMBER", "member@pulsefit.com");
        staffToken = jwtUtil.generateToken("staffUser", "ROLE_STAFF", "staff@pulsefit.com");
    }

    @Test
    void testAdminCanAccessUserListing() throws Exception {
        mockMvc.perform(get("/api/auth/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].username").exists())
                .andExpect(jsonPath("$[0].email").exists())
                .andExpect(jsonPath("$[0].role").exists())
                .andExpect(jsonPath("$[0].password").doesNotExist())
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist())
                .andExpect(jsonPath("$[1].password").doesNotExist())
                .andExpect(jsonPath("$[1].passwordHash").doesNotExist())
                .andExpect(jsonPath("$[2].password").doesNotExist())
                .andExpect(jsonPath("$[2].passwordHash").doesNotExist());
    }

    @Test
    void testMemberCannotAccessUserListing() throws Exception {
        mockMvc.perform(get("/api/auth/users")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Access denied: insufficient privileges"));
    }

    @Test
    void testStaffCannotAccessUserListing() throws Exception {
        mockMvc.perform(get("/api/auth/users")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Access denied: insufficient privileges"));
    }

    @Test
    void testMissingTokenRejectedForUserListing() throws Exception {
        mockMvc.perform(get("/api/auth/users"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    void testInvalidTokenRejectedForUserListing() throws Exception {
        mockMvc.perform(get("/api/auth/users")
                        .header("Authorization", "Bearer invalid.malformed.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    void testPasswordChangeMissingTokenRejected() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest("oldSecret123", "newSecret456");
        mockMvc.perform(post("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void testPasswordChangeWrongCurrentPasswordRejected() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest("wrongCurrentPass", "newSecret456");

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Current password does not match"));

        // Verify database password was NOT modified
        User member = userRepository.findByUsername("memberUser").orElseThrow();
        assertTrue(passwordEncoder.matches("memberPass123", member.getPassword()));
    }

    @Test
    void testPasswordChangeSuccessAllowsUpdateAndStoresBcrypt() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest("memberPass123", "brandNewSecret999");

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully for user: memberUser"))
                .andExpect(jsonPath("$.username").value("memberUser"));

        // Verify updated entity in database
        User updatedMember = userRepository.findByUsername("memberUser").orElseThrow();
        assertTrue(passwordEncoder.matches("brandNewSecret999", updatedMember.getPassword()),
                "New password must match the updated raw password");
        assertFalse(passwordEncoder.matches("memberPass123", updatedMember.getPassword()),
                "Old password must no longer match");
        assertTrue(updatedMember.getPassword().startsWith("$2a$"),
                "Password must be stored as a valid BCrypt hash");
        assertNotEquals("brandNewSecret999", updatedMember.getPassword(),
                "Plaintext password must never be stored");
    }

    @Test
    void testPasswordChangeCannotTargetAnotherUser() throws Exception {
        // Authenticated as memberUser, calling change-password
        ChangePasswordRequest request = new ChangePasswordRequest("memberPass123", "brandNewMemberPass123");

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Verify adminUser was untouched
        User admin = userRepository.findByUsername("adminUser").orElseThrow();
        assertTrue(passwordEncoder.matches("adminPass123", admin.getPassword()),
                "Admin password must remain completely unchanged");
    }

    @Test
    void testUnauthenticatedPasswordResetEndpointIsDisabled() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest("adminUser", "maliciousNewPass123");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Unauthenticated password reset is disabled for security. Please use /api/auth/change-password with valid authentication."));

        // Verify admin password was NOT changed by the disabled endpoint
        User admin = userRepository.findByUsername("adminUser").orElseThrow();
        assertTrue(passwordEncoder.matches("adminPass123", admin.getPassword()),
                "Admin password must not be compromised");
    }
}
