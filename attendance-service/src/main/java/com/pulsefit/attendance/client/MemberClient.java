package com.pulsefit.attendance.client;

import com.pulsefit.attendance.dto.MemberDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "member-service")
public interface MemberClient {

    @GetMapping("/api/members/{memberId}")
    MemberDto getMemberById(@PathVariable("memberId") Long memberId);
}
