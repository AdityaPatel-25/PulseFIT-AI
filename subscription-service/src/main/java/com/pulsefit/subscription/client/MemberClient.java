package com.pulsefit.subscription.client;

import com.pulsefit.subscription.dto.MemberDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "member-service")
public interface MemberClient {

    @GetMapping("/api/members/{memberId}")
    MemberDto getMemberById(@PathVariable("memberId") Long memberId);

    @GetMapping("/api/members/{memberId}/status")
    Map<String, Object> checkMemberStatus(@PathVariable("memberId") Long memberId);
}
