package com.pulsefit.attendance.client;

import com.pulsefit.attendance.dto.SubscriptionDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "subscription-service")
public interface SubscriptionClient {

    @GetMapping("/api/subscriptions/member/{memberId}/active")
    SubscriptionDto getActiveSubscription(@PathVariable("memberId") Long memberId);
}
