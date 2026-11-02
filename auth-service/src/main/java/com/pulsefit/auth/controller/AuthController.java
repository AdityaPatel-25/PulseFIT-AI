package com.pulsefit.auth.controller;

import com.pulsefit.auth.dto.AuthResponse;
import com.pulsefit.auth.dto.LoginRequest;
import com.pulsefit.auth.dto.RegisterRequest;
import com.pulsefit.auth.dto.TokenValidationResponse;
import com.pulsefit.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.pulsefit.auth.dto.ChangePasswordRequest;
import com.pulsefit.auth.dto.ResetPasswordRequest;
import com.pulsefit.auth.dto.SocialLoginRequest;
import com.pulsefit.auth.dto.UserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.security.Principal;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication & Security", description = "User registration, authentication, JWT token generation, and validation")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register new user account", description = "Creates a new user account with specified role (MEMBER, STAFF, ADMIN) and returns an initial JWT token")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user & obtain JWT token", description = "Validates credentials (username/password) and returns signed HMAC-SHA256 Bearer JWT token")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/social-login")
    @Operation(summary = "Social OAuth login simulation", description = "Simulates OAuth login via Google/Apple and issues JWT token")
    public ResponseEntity<?> socialLogin(@Valid @RequestBody SocialLoginRequest request) {
        try {
            AuthResponse response = authService.socialLogin(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password for authenticated user", description = "Verifies current password and updates to new password for the authenticated caller", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request, Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        try {
            Map<String, Object> response = authService.changePassword(principal.getName(), request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset user password (Disabled)", description = "Unauthenticated password reset is disabled for security")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", "Unauthenticated password reset is disabled for security. Please use /api/auth/change-password with valid authentication."
        ));
    }

    @GetMapping("/users")
    @Operation(summary = "List all registered accounts", description = "Returns user profiles and roles (ROLE_ADMIN access required)", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping("/validate")
    @Operation(
        summary = "Validate JWT Bearer Token",
        description = "Verifies signature and claims of the Bearer JWT token passed in Authorization header. Requires clicking 'Authorize' in Swagger with your JWT token.",
        security = @SecurityRequirement(name = "BearerAuth")
    )
    public ResponseEntity<TokenValidationResponse> validateToken(
            @Parameter(description = "Bearer JWT token string (auto-injected when using Swagger Authorize button)")
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(TokenValidationResponse.failure("Missing or malformed Authorization header"));
        }
        TokenValidationResponse response = authService.validateToken(authHeader);
        if (response.isValid()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "service", "auth-service",
                "status", "UP",
                "timestamp", java.time.LocalDateTime.now().toString()
        ));
    }
}
