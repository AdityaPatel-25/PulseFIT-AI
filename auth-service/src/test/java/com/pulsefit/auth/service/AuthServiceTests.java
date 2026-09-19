package com.pulsefit.auth.service;

import com.pulsefit.auth.dto.AuthResponse;
import com.pulsefit.auth.dto.LoginRequest;
import com.pulsefit.auth.dto.RegisterRequest;
import com.pulsefit.auth.model.User;
import com.pulsefit.auth.repository.UserRepository;
import com.pulsefit.auth.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;

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
    void testRegisterSuccess() {
        RegisterRequest request = new RegisterRequest("newuser", "pass123", "new@pulsefit.com", "MEMBER");
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@pulsefit.com")).thenReturn(false);
        when(passwordEncoder.encode("pass123")).thenReturn("encodedPass");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        AuthResponse response = authService.register(request);
        assertNotNull(response);
        assertEquals("newuser", response.getUsername());
        assertEquals("ROLE_MEMBER", response.getRole());
        assertNotNull(response.getToken());
    }

    @Test
    void testLoginSuccess() {
        LoginRequest request = new LoginRequest("existinguser", "pass123");
        User user = new User("existinguser", "encodedPass", "existing@pulsefit.com", "ROLE_MEMBER");

        when(userRepository.findByUsername("existinguser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass123", "encodedPass")).thenReturn(true);

        AuthResponse response = authService.login(request);
        assertNotNull(response);
        assertEquals("existinguser", response.getUsername());
    }

    @Test
    void testLoginInvalidPassword() {
        LoginRequest request = new LoginRequest("existinguser", "wrongpass");
        User user = new User("existinguser", "encodedPass", "existing@pulsefit.com", "ROLE_MEMBER");

        when(userRepository.findByUsername("existinguser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass", "encodedPass")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> authService.login(request));
    }
}
