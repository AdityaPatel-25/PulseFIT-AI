package com.pulsefit.subscription.service;

import com.pulsefit.subscription.client.MemberClient;
import com.pulsefit.subscription.dto.MemberDto;
import com.pulsefit.subscription.dto.RenewalRequest;
import com.pulsefit.subscription.dto.SubscriptionRequest;
import com.pulsefit.subscription.dto.SubscriptionResponse;
import com.pulsefit.subscription.model.Subscription;
import com.pulsefit.subscription.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class SubscriptionServiceTests {

    private SubscriptionRepository subscriptionRepository;
    private MemberClient memberClient;
    private SubscriptionService subscriptionService;

    @BeforeEach
    void setUp() {
        subscriptionRepository = Mockito.mock(SubscriptionRepository.class);
        memberClient = Mockito.mock(MemberClient.class);
        subscriptionService = new SubscriptionService(subscriptionRepository, memberClient);
    }

    @Test
    void testCreateSubscriptionSuccess() {
        MemberDto memberDto = new MemberDto();
        memberDto.setMemberId(1L);
        memberDto.setStatus("ACTIVE");

        when(memberClient.getMemberById(1L)).thenReturn(memberDto);

        SubscriptionRequest req = new SubscriptionRequest(1L, "BASIC_MONTHLY", LocalDate.now(), 1, "SINGLE_FACILITY", 49.99, false);

        Subscription sub = new Subscription(1L, "BASIC_MONTHLY", LocalDate.now(), LocalDate.now().plusMonths(1), "SINGLE_FACILITY", 49.99, false);
        sub.setSubscriptionId(100L);

        when(subscriptionRepository.save(any(Subscription.class))).thenReturn(sub);

        SubscriptionResponse response = subscriptionService.createSubscription(req);
        assertNotNull(response);
        assertEquals(100L, response.getSubscriptionId());
        assertEquals("BASIC_MONTHLY", response.getPlanType());
        assertTrue(response.isCurrentlyValid());
    }

    @Test
    void testRenewSubscription() {
        LocalDate currentExpiry = LocalDate.now().plusDays(10);
        Subscription sub = new Subscription(1L, "BASIC_MONTHLY", LocalDate.now().minusDays(20), currentExpiry, "SINGLE_FACILITY", 49.99, false);
        sub.setSubscriptionId(100L);

        when(subscriptionRepository.findById(100L)).thenReturn(Optional.of(sub));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArguments()[0]);

        RenewalRequest renewal = new RenewalRequest(3, "PREMIUM_QUARTERLY", 129.99);
        SubscriptionResponse response = subscriptionService.renewSubscription(100L, renewal);

        assertNotNull(response);
        assertEquals(currentExpiry.plusMonths(3), response.getExpiryDate());
        assertEquals("PREMIUM_QUARTERLY", response.getPlanType());
        assertEquals("ACTIVE", response.getStatus());
    }

    @Test
    void testGetActiveSubscriptionFound() {
        Subscription sub = new Subscription(1L, "ALL_ACCESS_ANNUAL", LocalDate.now().minusMonths(1), LocalDate.now().plusMonths(11), "MULTI_FACILITY", 599.99, true);
        sub.setSubscriptionId(50L);

        when(subscriptionRepository.findActiveSubscriptions(Mockito.eq(1L), any(LocalDate.class)))
                .thenReturn(List.of(sub));

        Optional<SubscriptionResponse> activeSub = subscriptionService.getActiveSubscriptionForMember(1L);
        assertTrue(activeSub.isPresent());
        assertEquals(50L, activeSub.get().getSubscriptionId());
        assertTrue(activeSub.get().isCurrentlyValid());
    }
}
