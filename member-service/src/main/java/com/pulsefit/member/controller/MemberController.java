package com.pulsefit.member.controller;

import com.pulsefit.member.dto.MemberRequest;
import com.pulsefit.member.dto.MemberResponse;
import com.pulsefit.member.service.MemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/members")
@Tag(name = "Member Profile Management", description = "Endpoints for creating, retrieving, updating, and deactivating member records")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @PostMapping
    @Operation(summary = "Create a new member", description = "Registers a new member profile", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<?> createMember(@Valid @RequestBody MemberRequest request) {
        try {
            MemberResponse response = memberService.createMember(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{memberId}")
    @Operation(summary = "Get member by ID", description = "Retrieves profile and status for a specific member", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<?> getMemberById(@PathVariable("memberId") Long memberId) {
        try {
            MemberResponse response = memberService.getMemberById(memberId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @Operation(summary = "Get all members", description = "Retrieves all registered gym members in the platform", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<List<MemberResponse>> getAllMembers() {
        return ResponseEntity.ok(memberService.getAllMembers());
    }

    @PutMapping("/{memberId}")
    @Operation(summary = "Update member profile", description = "Updates details for an existing member", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<?> updateMember(@PathVariable("memberId") Long memberId, @Valid @RequestBody MemberRequest request) {
        try {
            MemberResponse response = memberService.updateMember(memberId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{memberId}")
    @Operation(summary = "Deactivate member", description = "Sets member status to INACTIVE", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<?> deactivateMember(@PathVariable("memberId") Long memberId) {
        try {
            memberService.deactivateMember(memberId);
            return ResponseEntity.ok(Map.of("message", "Member successfully deactivated", "memberId", memberId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{memberId}/status")
    @Operation(summary = "Check member active status", description = "Quick status check for turnstile gate verification", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<Map<String, Object>> checkStatus(@PathVariable("memberId") Long memberId) {
        boolean active = memberService.isMemberActive(memberId);
        return ResponseEntity.ok(Map.of(
                "memberId", memberId,
                "isActive", active
        ));
    }
}
