package com.pulsefit.subscription.controller;

import com.pulsefit.subscription.dto.RenewalRequest;
import com.pulsefit.subscription.dto.SubscriptionRequest;
import com.pulsefit.subscription.dto.SubscriptionResponse;
import com.pulsefit.subscription.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping
    public ResponseEntity<?> createSubscription(@Valid @RequestBody SubscriptionRequest request) {
        try {
            SubscriptionResponse response = subscriptionService.createSubscription(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{subscriptionId}")
    public ResponseEntity<?> getSubscriptionById(@PathVariable("subscriptionId") Long subscriptionId) {
        try {
            SubscriptionResponse response = subscriptionService.getSubscriptionById(subscriptionId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<SubscriptionResponse>> getAllSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getAllSubscriptions());
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<SubscriptionResponse>> getSubscriptionsByMemberId(@PathVariable("memberId") Long memberId) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionsByMemberId(memberId));
    }

    @GetMapping("/member/{memberId}/active")
    public ResponseEntity<?> getActiveSubscriptionForMember(@PathVariable("memberId") Long memberId) {
        Optional<SubscriptionResponse> activeSub = subscriptionService.getActiveSubscriptionForMember(memberId);
        if (activeSub.isPresent()) {
            return ResponseEntity.ok(activeSub.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "memberId", memberId,
                    "hasActiveSubscription", false,
                    "message", "No active non-expired subscription found for member"
            ));
        }
    }

    @PostMapping("/{subscriptionId}/renew")
    public ResponseEntity<?> renewSubscription(
            @PathVariable("subscriptionId") Long subscriptionId,
            @RequestBody(required = false) RenewalRequest request) {
        try {
            SubscriptionResponse response = subscriptionService.renewSubscription(subscriptionId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
