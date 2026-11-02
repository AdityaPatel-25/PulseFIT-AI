package com.pulsefit.auth.service;

import com.pulsefit.auth.dto.AuthResponse;
import com.pulsefit.auth.dto.LoginRequest;
import com.pulsefit.auth.dto.RegisterRequest;
import com.pulsefit.auth.dto.TokenValidationResponse;
import com.pulsefit.auth.model.User;
import com.pulsefit.auth.repository.UserRepository;
import com.pulsefit.auth.security.JwtUtil;
import com.pulsefit.auth.dto.ChangePasswordRequest;
import com.pulsefit.auth.dto.ResetPasswordRequest;
import com.pulsefit.auth.dto.SocialLoginRequest;
import com.pulsefit.auth.dto.UserDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest request) {
        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists: " + username);
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists: " + email);
        }

        String role = request.getRole();
        if (role == null || role.isBlank()) {
            role = "ROLE_MEMBER";
        } else if (!role.startsWith("ROLE_")) {
            role = "ROLE_" + role.toUpperCase();
        }

        User user = new User(
                username,
                passwordEncoder.encode(request.getPassword()),
                email,
                role,
                request.getMemberId()
        );

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getEmail(), user.getMemberId());
        return new AuthResponse(token, user.getUsername(), user.getEmail(), user.getRole(), jwtUtil.getExpirationMs());
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.getUsername() != null ? request.getUsername().trim() : "";
        if (identifier.isBlank() || request.getPassword() == null) {
            throw new IllegalArgumentException("Wrong username or password");
        }

        Optional<User> userOpt = userRepository.findByUsername(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(identifier);
        }
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(identifier.toLowerCase());
        }
        if (userOpt.isEmpty() && identifier.contains("@")) {
            String prefix = identifier.substring(0, identifier.indexOf("@"));
            userOpt = userRepository.findByUsername(prefix);
        }
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Wrong username or password");
        }

        User user = userOpt.get();
        boolean passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!passwordMatches) {
            throw new IllegalArgumentException("Wrong username or password");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getEmail(), user.getMemberId());
        return new AuthResponse(token, user.getUsername(), user.getEmail(), user.getRole(), jwtUtil.getExpirationMs());
    }

    public AuthResponse socialLogin(SocialLoginRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        if (email.isBlank()) {
            throw new IllegalArgumentException("Email is required for social login");
        }

        String provider = request.getProvider() != null ? request.getProvider().toUpperCase() : "OAUTH";

        Optional<User> userOpt = userRepository.findByEmail(email);
        User user;

        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            // Derive a clean username from name or email
            String baseUsername;
            if (request.getName() != null && !request.getName().isBlank()) {
                baseUsername = request.getName().trim().toLowerCase().replaceAll("[^a-z0-9_]", "_");
            } else {
                baseUsername = email.split("@")[0].toLowerCase().replaceAll("[^a-z0-9_]", "_");
            }
            if (baseUsername.length() > 40) {
                baseUsername = baseUsername.substring(0, 40);
            }
            String tag = provider.equalsIgnoreCase("GITHUB") ? "gh" : "g";
            String candidateUsername = baseUsername + "_" + tag;

            int suffix = 1;
            while (userRepository.existsByUsername(candidateUsername)) {
                candidateUsername = baseUsername + "_" + tag + suffix;
                suffix++;
            }

            String role = request.getRole();
            if (role == null || role.isBlank()) {
                role = "ROLE_MEMBER";
            } else if (!role.startsWith("ROLE_")) {
                role = "ROLE_" + role.toUpperCase();
            }

            String randomPassword = UUID.randomUUID().toString();
            user = new User(
                    candidateUsername,
                    passwordEncoder.encode(randomPassword),
                    email,
                    role
            );
            userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getEmail(), user.getMemberId());
        return new AuthResponse(token, user.getUsername(), user.getEmail(), user.getRole(), jwtUtil.getExpirationMs());
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserDto(
                        u.getId(),
                        u.getUsername(),
                        u.getEmail(),
                        u.getRole(),
                        u.getMemberId(),
                        u.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    public TokenValidationResponse validateToken(String token) {
        if (token == null || token.isBlank()) {
            return TokenValidationResponse.failure("Empty token");
        }

        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        if (jwtUtil.validateToken(token)) {
            String username = jwtUtil.extractUsername(token);
            String role = jwtUtil.extractRole(token);
            return TokenValidationResponse.success(username, role);
        } else {
            return TokenValidationResponse.failure("Invalid or expired token");
        }
    }

    public Map<String, Object> changePassword(String authenticatedUsername, ChangePasswordRequest request) {
        if (authenticatedUsername == null || authenticatedUsername.isBlank()) {
            throw new IllegalArgumentException("Authentication required");
        }

        User user = userRepository.findByUsername(authenticatedUsername)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user account not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password does not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return Map.of(
                "message", "Password changed successfully for user: " + user.getUsername(),
                "username", user.getUsername()
        );
    }

    public Map<String, Object> resetPassword(ResetPasswordRequest request) {
        throw new UnsupportedOperationException(
                "Unauthenticated password reset is disabled for security. Please use authenticated password change at /api/auth/change-password."
        );
    }
}
