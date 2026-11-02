package com.pulsefit.auth.service;

import com.pulsefit.auth.dto.AuthResponse;
import com.pulsefit.auth.dto.ChangePasswordRequest;
import com.pulsefit.auth.dto.LoginRequest;
import com.pulsefit.auth.dto.RegisterRequest;
import com.pulsefit.auth.dto.ResetPasswordRequest;
import com.pulsefit.auth.dto.UserDto;
import com.pulsefit.auth.model.User;
import com.pulsefit.auth.repository.UserRepository;
import com.pulsefit.auth.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class AuthServiceTests {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtUtil jwtUtil;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        passwordEncoder = Mockito.mock(PasswordEncoder.class);
        jwtUtil = new JwtUtil("PulseFitSuperSecretKeyForJWTHMACSHA256EnterpriseSecurity2024!", 3600000);
        authService = new AuthService(userRepository, passwordEncoder, jwtUtil);
    }

    @Test
    void testLoginSuccessProducesJwt() {
        LoginRequest request = new LoginRequest("existinguser", "pass123");
        User user = new User("existinguser", "encodedPass", "existing@pulsefit.com", "ROLE_MEMBER");

        when(userRepository.findByUsername("existinguser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass123", "encodedPass")).thenReturn(true);

        AuthResponse response = authService.login(request);
        assertNotNull(response);
        assertEquals("existinguser", response.getUsername());
        assertEquals("ROLE_MEMBER", response.getRole());
        assertNotNull(response.getToken());
        assertTrue(jwtUtil.validateToken(response.getToken()));
        assertEquals("existinguser", jwtUtil.extractUsername(response.getToken()));
    }

    @Test
    void testLoginIncorrectPasswordRejected() {
        LoginRequest request = new LoginRequest("existinguser", "wrongpass");
        User user = new User("existinguser", "encodedPass", "existing@pulsefit.com", "ROLE_MEMBER");

        when(userRepository.findByUsername("existinguser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass", "encodedPass")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.login(request));
        assertEquals("Wrong username or password", ex.getMessage());
    }

    @Test
    void testLoginUnknownUsernameRejected() {
        LoginRequest request = new LoginRequest("nonexistentuser", "pass123");

        when(userRepository.findByUsername("nonexistentuser")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("nonexistentuser")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.login(request));
        assertEquals("Wrong username or password", ex.getMessage());
    }

    @Test
    void testNoHardcodedCredentialBypassWorks() {
        // Test that removed backdoors (member_alex with alex123, admin with admin123, staff_john with staff123)
        // fail immediately when passwordEncoder.matches returns false
        User alex = new User("member_alex", "$2a$10$hashedAlexPassword", "alex@pulsefit.com", "ROLE_MEMBER");
        when(userRepository.findByUsername("member_alex")).thenReturn(Optional.of(alex));
        when(passwordEncoder.matches("alex123", "$2a$10$hashedAlexPassword")).thenReturn(false);

        LoginRequest alexBackdoor = new LoginRequest("member_alex", "alex123");
        assertThrows(IllegalArgumentException.class, () -> authService.login(alexBackdoor),
                "Hardcoded bypass 'alex123' must be rejected");

        User admin = new User("admin", "$2a$10$hashedAdminPassword", "admin@pulsefit.com", "ROLE_ADMIN");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("admin123", "$2a$10$hashedAdminPassword")).thenReturn(false);

        LoginRequest adminBackdoor = new LoginRequest("admin", "admin123");
        assertThrows(IllegalArgumentException.class, () -> authService.login(adminBackdoor),
                "Hardcoded bypass 'admin123' without passwordEncoder.matches must be rejected");
    }

    @Test
    void testRegistrationStoresBcryptHashedPassword() {
        RegisterRequest request = new RegisterRequest("newmember", "rawSecret123", "newmember@pulsefit.com", "MEMBER");
        when(userRepository.existsByUsername("newmember")).thenReturn(false);
        when(userRepository.existsByEmail("newmember@pulsefit.com")).thenReturn(false);
        when(passwordEncoder.encode("rawSecret123")).thenReturn("$2a$10$BcryptHashedString98765");
        
        final User[] savedUserHolder = new User[1];
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            savedUserHolder[0] = i.getArgument(0);
            return savedUserHolder[0];
        });

        AuthResponse response = authService.register(request);
        assertNotNull(response);
        assertNotNull(savedUserHolder[0], "User entity must be persisted");
        assertEquals("$2a$10$BcryptHashedString98765", savedUserHolder[0].getPassword(),
                "Password must be stored in BCrypt hashed form, never in plaintext");
        assertNotEquals("rawSecret123", savedUserHolder[0].getPassword());
    }

    @Test
    void testChangePasswordSuccessEncodesNewPassword() {
        User user = new User("activeUser", "$2a$10$existingHash", "user@pulsefit.com", "ROLE_MEMBER");
        when(userRepository.findByUsername("activeUser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("currentPassword123", "$2a$10$existingHash")).thenReturn(true);
        when(passwordEncoder.encode("newPassword456")).thenReturn("$2a$10$newlyHashedPassword");

        final User[] savedUser = new User[1];
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            savedUser[0] = i.getArgument(0);
            return savedUser[0];
        });

        ChangePasswordRequest request = new ChangePasswordRequest("currentPassword123", "newPassword456");
        Map<String, Object> result = authService.changePassword("activeUser", request);

        assertNotNull(result);
        assertEquals("activeUser", result.get("username"));
        assertNotNull(savedUser[0]);
        assertEquals("$2a$10$newlyHashedPassword", savedUser[0].getPassword(),
                "New password must be stored as BCrypt hash");
    }

    @Test
    void testChangePasswordWrongCurrentPasswordRejected() {
        User user = new User("activeUser", "$2a$10$existingHash", "user@pulsefit.com", "ROLE_MEMBER");
        when(userRepository.findByUsername("activeUser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongCurrentPass", "$2a$10$existingHash")).thenReturn(false);

        ChangePasswordRequest request = new ChangePasswordRequest("wrongCurrentPass", "newPassword456");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> authService.changePassword("activeUser", request));

        assertEquals("Current password does not match", ex.getMessage());
    }

    @Test
    void testChangePasswordBoundToAuthenticatedUserNotTargetUser() {
        // Authenticated user is "alice", but attacker tries to target "bob"
        User alice = new User("alice", "$2a$10$aliceHash", "alice@pulsefit.com", "ROLE_MEMBER");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
        when(passwordEncoder.matches("aliceCurrentPass", "$2a$10$aliceHash")).thenReturn(true);
        when(passwordEncoder.encode("newAlicePass")).thenReturn("$2a$10$newAliceHash");

        ChangePasswordRequest request = new ChangePasswordRequest("aliceCurrentPass", "newAlicePass");
        // Caller passes authenticated user "alice" - identity is strictly bound to authenticated token
        Map<String, Object> result = authService.changePassword("alice", request);

        assertEquals("alice", result.get("username"));
        // Verify bob was never touched
        Mockito.verify(userRepository, Mockito.never()).findByUsername("bob");
    }

    @Test
    void testGetAllUsersExcludesPasswordHash() {
        User u1 = new User("admin", "$2a$10$secretHash1", "admin@pulsefit.com", "ROLE_ADMIN");
        User u2 = new User("member1", "$2a$10$secretHash2", "member@pulsefit.com", "ROLE_MEMBER");
        when(userRepository.findAll()).thenReturn(List.of(u1, u2));

        List<UserDto> users = authService.getAllUsers();
        assertEquals(2, users.size());
        for (UserDto dto : users) {
            assertNotNull(dto.getUsername());
            assertNotNull(dto.getEmail());
            assertNotNull(dto.getRole());
            // UserDto has no getPasswordHash() or getPassword() method, ensuring hashes cannot leak
        }
    }

    @Test
    void testUnauthenticatedResetPasswordDisabled() {
        ResetPasswordRequest request = new ResetPasswordRequest("anyuser", "anyNewPass");
        UnsupportedOperationException ex = assertThrows(UnsupportedOperationException.class,
                () -> authService.resetPassword(request));
        assertTrue(ex.getMessage().contains("Unauthenticated password reset is disabled for security"));
    }
}
