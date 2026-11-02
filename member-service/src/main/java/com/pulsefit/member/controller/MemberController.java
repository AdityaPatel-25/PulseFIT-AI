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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/members")
@Tag(name = "Member Profile Management", description = "Endpoints for creating, retrieving, updating, and deleting member records")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Create a new member", description = "Registers a new gym member profile", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<MemberResponse> createMember(@Valid @RequestBody MemberRequest request) {
        MemberResponse response = memberService.createMember(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{memberId}")
    @PreAuthorize("@securityEvaluator.canAccessMember(#memberId)")
    @Operation(summary = "Get member by ID", description = "Retrieves profile and status for a specific member", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<MemberResponse> getMemberById(@PathVariable("memberId") Long memberId) {
        MemberResponse response = memberService.getMemberById(memberId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'MEMBER')")
    @Operation(summary = "Get all members", description = "Retrieves all registered gym members in the platform", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<List<MemberResponse>> getAllMembers() {
        return ResponseEntity.ok(memberService.getAllMembers());
    }

    @PutMapping("/{memberId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Update member profile", description = "Updates profile details for an existing member", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<MemberResponse> updateMember(
            @PathVariable("memberId") Long memberId,
            @Valid @RequestBody MemberRequest request) {
        MemberResponse response = memberService.updateMember(memberId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{memberId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete member", description = "Deletes member record from database. Use soft=true to set status to INACTIVE instead of permanent deletion.", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<Map<String, Object>> deleteMember(
            @PathVariable("memberId") Long memberId,
            @RequestParam(name = "soft", defaultValue = "false") boolean soft) {
        if (soft) {
            memberService.deactivateMember(memberId);
            return ResponseEntity.ok(Map.of(
                    "message", "Member successfully deactivated",
                    "memberId", memberId,
                    "status", "INACTIVE"
            ));
        }
        memberService.deleteMember(memberId);
        return ResponseEntity.ok(Map.of(
                "message", "Member successfully deleted",
                "memberId", memberId
        ));
    }

    @PatchMapping("/{memberId}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Deactivate member", description = "Sets member status to INACTIVE", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<Map<String, Object>> deactivateMember(@PathVariable("memberId") Long memberId) {
        memberService.deactivateMember(memberId);
        return ResponseEntity.ok(Map.of(
                "message", "Member successfully deactivated",
                "memberId", memberId,
                "status", "INACTIVE"
        ));
    }

    @GetMapping("/{memberId}/status")
    @PreAuthorize("@securityEvaluator.canAccessMember(#memberId)")
    @Operation(summary = "Check member active status", description = "Quick status check for turnstile gate verification", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<Map<String, Object>> checkStatus(@PathVariable("memberId") Long memberId) {
        MemberResponse member = memberService.getMemberById(memberId);
        boolean active = "ACTIVE".equalsIgnoreCase(member.getStatus());
        return ResponseEntity.ok(Map.of(
                "memberId", memberId,
                "isActive", active,
                "status", member.getStatus()
        ));
    }
}
