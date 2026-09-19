package com.pulsefit.member.controller;

import com.pulsefit.member.dto.MemberRequest;
import com.pulsefit.member.dto.MemberResponse;
import com.pulsefit.member.service.MemberService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @PostMapping
    public ResponseEntity<?> createMember(@Valid @RequestBody MemberRequest request) {
        try {
            MemberResponse response = memberService.createMember(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{memberId}")
    public ResponseEntity<?> getMemberById(@PathVariable("memberId") Long memberId) {
        try {
            MemberResponse response = memberService.getMemberById(memberId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<MemberResponse>> getAllMembers() {
        return ResponseEntity.ok(memberService.getAllMembers());
    }

    @PutMapping("/{memberId}")
    public ResponseEntity<?> updateMember(@PathVariable("memberId") Long memberId, @Valid @RequestBody MemberRequest request) {
        try {
            MemberResponse response = memberService.updateMember(memberId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{memberId}")
    public ResponseEntity<?> deactivateMember(@PathVariable("memberId") Long memberId) {
        try {
            memberService.deactivateMember(memberId);
            return ResponseEntity.ok(Map.of("message", "Member successfully deactivated", "memberId", memberId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{memberId}/status")
    public ResponseEntity<Map<String, Object>> checkStatus(@PathVariable("memberId") Long memberId) {
        boolean active = memberService.isMemberActive(memberId);
        return ResponseEntity.ok(Map.of(
                "memberId", memberId,
                "isActive", active
        ));
    }
}
