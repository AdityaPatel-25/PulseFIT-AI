package com.pulsefit.subscription.controller;

import com.pulsefit.subscription.dto.GracePeriodResultDto;
import com.pulsefit.subscription.dto.PlanOptimizationDto;
import com.pulsefit.subscription.service.AiSubscriptionOptimizerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions/ai")
public class SubscriptionAiController {

    private final AiSubscriptionOptimizerService aiSubscriptionOptimizerService;

    public SubscriptionAiController(AiSubscriptionOptimizerService aiSubscriptionOptimizerService) {
        this.aiSubscriptionOptimizerService = aiSubscriptionOptimizerService;
    }

    @PostMapping("/grant-courtesy-pass/{subscriptionId}")
    public ResponseEntity<?> grantCourtesyPass(@PathVariable("subscriptionId") Long subscriptionId) {
        try {
            GracePeriodResultDto result = aiSubscriptionOptimizerService.grantGracePeriod(subscriptionId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/optimize/{memberId}")
    public ResponseEntity<PlanOptimizationDto> getPlanOptimization(@PathVariable("memberId") Long memberId) {
        return ResponseEntity.ok(aiSubscriptionOptimizerService.optimizePlan(memberId));
    }
}
