package com.pulsefit.member.controller;

import com.pulsefit.member.dto.ChurnRiskSummaryDto;
import com.pulsefit.member.dto.MemberRetentionInsightDto;
import com.pulsefit.member.service.AiRetentionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/members/ai")
public class MemberAiController {

    private final AiRetentionService aiRetentionService;

    public MemberAiController(AiRetentionService aiRetentionService) {
        this.aiRetentionService = aiRetentionService;
    }

    @GetMapping("/retention/{memberId}")
    public ResponseEntity<?> getMemberRetentionInsights(@PathVariable("memberId") Long memberId) {
        try {
            MemberRetentionInsightDto insight = aiRetentionService.getMemberRetentionInsight(memberId);
            return ResponseEntity.ok(insight);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/churn-report")
    public ResponseEntity<ChurnRiskSummaryDto> getFacilityChurnReport() {
        return ResponseEntity.ok(aiRetentionService.getFacilityChurnRiskSummary());
    }
}
