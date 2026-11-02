package com.pulsefit.subscription.controller;

import com.pulsefit.subscription.dto.RenewalRequest;
import com.pulsefit.subscription.dto.SubscriptionRequest;
import com.pulsefit.subscription.dto.SubscriptionResponse;
import com.pulsefit.subscription.dto.SubscriptionStatusResponse;
import com.pulsefit.subscription.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/subscriptions")
@Tag(name = "Subscription Management", description = "Endpoints for creating, retrieving, renewing, and tracking member subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF') or (hasRole('MEMBER') and @securityEvaluator.canAccessMember(#request.memberId))")
    @Operation(summary = "Create a subscription", description = "Creates a new active subscription for a member and plan. Verifies member in Member Service and prevents overlapping subscriptions.")
    public ResponseEntity<SubscriptionResponse> createSubscription(@Valid @RequestBody SubscriptionRequest request) {
        SubscriptionResponse response = subscriptionService.createSubscription(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'MEMBER')")
    @Operation(summary = "Retrieve all subscriptions", description = "Returns all subscriptions, automatically updating expired statuses")
    public ResponseEntity<List<SubscriptionResponse>> getAllSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getAllSubscriptions());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'MEMBER')")
    @Operation(summary = "Retrieve a subscription by ID", description = "Returns subscription details by ID")
    public ResponseEntity<SubscriptionResponse> getSubscriptionById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionById(id));
    }

    @GetMapping("/member/{memberId}")
    @PreAuthorize("@securityEvaluator.canAccessMember(#memberId)")
    @Operation(summary = "Retrieve subscriptions by member", description = "Returns all subscriptions associated with a specific member ID")
    public ResponseEntity<List<SubscriptionResponse>> getSubscriptionsByMemberId(@PathVariable("memberId") Long memberId) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionsByMemberId(memberId));
    }

    @GetMapping("/member/{memberId}/active")
    @PreAuthorize("@securityEvaluator.canAccessMember(#memberId)")
    @Operation(summary = "Retrieve active subscription for member", description = "Returns the current active, non-expired subscription for turnstile or facility access")
    public ResponseEntity<?> getActiveSubscriptionForMember(@PathVariable("memberId") Long memberId) {
        Optional<SubscriptionResponse> activeSub = subscriptionService.getActiveSubscriptionForMember(memberId);
        if (activeSub.isPresent()) {
            return ResponseEntity.ok(activeSub.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "memberId", memberId,
                    "hasActiveSubscription", false,
                    "message", "No active subscription found for member"
            ));
        }
    }

    @RequestMapping(value = "/{id}/renew", method = {RequestMethod.PUT, RequestMethod.POST})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'MEMBER')")
    @Operation(summary = "Renew an existing subscription", description = "Extends an active subscription from its current expiry date, or calculates a new start date from today if expired")
    public ResponseEntity<SubscriptionResponse> renewSubscription(
            @PathVariable("id") Long id,
            @RequestBody(required = false) RenewalRequest request) {
        SubscriptionResponse response = subscriptionService.renewSubscription(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'MEMBER')")
    @Operation(summary = "Retrieve subscription status", description = "Returns real-time status, days remaining, validity, and expiration check")
    public ResponseEntity<SubscriptionStatusResponse> getSubscriptionStatus(@PathVariable("id") Long id) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionStatus(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Cancel or delete subscription", description = "Cancels subscription by ID, setting status to CANCELLED to preserve audit history while invalidating active access. Supports permanent deletion when hard=true.")
    public ResponseEntity<Void> deleteSubscription(
            @PathVariable("id") Long id,
            @RequestParam(name = "hard", defaultValue = "false") boolean hard) {
        if (hard) {
            subscriptionService.deleteSubscriptionPermanently(id);
        } else {
            subscriptionService.deleteSubscription(id);
        }
        return ResponseEntity.noContent().build();
    }
}
