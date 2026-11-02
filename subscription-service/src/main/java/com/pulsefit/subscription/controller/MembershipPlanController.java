package com.pulsefit.subscription.controller;

import com.pulsefit.subscription.dto.MembershipPlanRequest;
import com.pulsefit.subscription.dto.MembershipPlanResponse;
import com.pulsefit.subscription.service.MembershipPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/plans")
@Tag(name = "Membership Plan Management", description = "Endpoints for creating, retrieving, updating, and deactivating membership plans")
public class MembershipPlanController {

    private final MembershipPlanService membershipPlanService;

    public MembershipPlanController(MembershipPlanService membershipPlanService) {
        this.membershipPlanService = membershipPlanService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Create a membership plan", description = "Registers a new membership plan with name, duration, and price")
    public ResponseEntity<MembershipPlanResponse> createPlan(@Valid @RequestBody MembershipPlanRequest request) {
        MembershipPlanResponse response = membershipPlanService.createPlan(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'MEMBER')")
    @Operation(summary = "Retrieve all membership plans", description = "Returns all available membership plans")
    public ResponseEntity<List<MembershipPlanResponse>> getAllPlans() {
        return ResponseEntity.ok(membershipPlanService.getAllPlans());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'MEMBER')")
    @Operation(summary = "Retrieve a plan by ID", description = "Returns membership plan details by planId")
    public ResponseEntity<MembershipPlanResponse> getPlanById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(membershipPlanService.getPlanById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Update a membership plan", description = "Updates details of an existing membership plan")
    public ResponseEntity<MembershipPlanResponse> updatePlan(
            @PathVariable("id") Long id,
            @Valid @RequestBody MembershipPlanRequest request) {
        return ResponseEntity.ok(membershipPlanService.updatePlan(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Deactivate a plan safely", description = "Safely sets plan active status to false to prevent new subscriptions while preserving existing ones")
    public ResponseEntity<Map<String, Object>> deactivatePlan(@PathVariable("id") Long id) {
        MembershipPlanResponse deactivated = membershipPlanService.deactivatePlan(id);
        return ResponseEntity.ok(Map.of(
                "message", "Membership plan safely deactivated",
                "planId", id,
                "planName", deactivated.getPlanName(),
                "active", false
        ));
    }
}
