package com.pulsefit.subscription.service;

import com.pulsefit.subscription.client.MemberClient;
import com.pulsefit.subscription.dto.MemberDto;
import com.pulsefit.subscription.dto.RenewalRequest;
import com.pulsefit.subscription.dto.SubscriptionRequest;
import com.pulsefit.subscription.dto.SubscriptionResponse;
import com.pulsefit.subscription.dto.SubscriptionStatusResponse;
import com.pulsefit.subscription.entity.MembershipPlan;
import com.pulsefit.subscription.entity.Subscription;
import com.pulsefit.subscription.exception.ResourceNotFoundException;
import com.pulsefit.subscription.repository.MembershipPlanRepository;
import com.pulsefit.subscription.repository.SubscriptionRepository;
import feign.FeignException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class SubscriptionServiceTests {

    private SubscriptionRepository subscriptionRepository;
    private MembershipPlanRepository planRepository;
    private MemberClient memberClient;
    private SubscriptionService subscriptionService;

    @BeforeEach
    void setUp() {
        subscriptionRepository = Mockito.mock(SubscriptionRepository.class);
        planRepository = Mockito.mock(MembershipPlanRepository.class);
        memberClient = Mockito.mock(MemberClient.class);
        subscriptionService = new SubscriptionService(subscriptionRepository, planRepository, memberClient);
    }

    @Test
    void testCreateSubscriptionForValidMemberSuccess() {
        Long memberId = 10L;
        Long planId = 1L;
        LocalDate startDate = LocalDate.now();

        // 1. Mock valid member in Member Service
        MemberDto memberDto = new MemberDto();
        memberDto.setMemberId(memberId);
        memberDto.setName("Alex Mercer");
        memberDto.setStatus("ACTIVE");
        when(memberClient.getMemberById(memberId)).thenReturn(memberDto);

        // 2. Mock active plan
        MembershipPlan plan = new MembershipPlan("Gold 30 Days", "Desc", 30, 49.99, true);
        plan.setPlanId(planId);
        when(planRepository.findById(planId)).thenReturn(Optional.of(plan));

        // 3. Mock no overlapping active subscriptions
        when(subscriptionRepository.findActiveSubscriptions(eq(memberId), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        // 4. Mock save
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> {
            Subscription s = invocation.getArgument(0);
            s.setSubscriptionId(100L);
            return s;
        });

        SubscriptionRequest request = new SubscriptionRequest(memberId, planId, startDate);
        SubscriptionResponse response = subscriptionService.createSubscription(request);

        assertNotNull(response);
        assertEquals(100L, response.getSubscriptionId());
        assertEquals(memberId, response.getMemberId());
        assertEquals(planId, response.getPlanId());
        assertEquals("Gold 30 Days", response.getPlanName());
        assertEquals(startDate, response.getStartDate());
        assertEquals(startDate.plusDays(30), response.getExpiryDate());
        assertEquals("ACTIVE", response.getStatus());
        assertTrue(response.isCurrentlyValid());
        verify(subscriptionRepository, times(1)).save(any(Subscription.class));
    }

    @Test
    void testCreateSubscriptionRejectNonexistentMemberThrowsException() {
        Long memberId = 999L;
        Long planId = 1L;

        feign.Request feignRequest = feign.Request.create(
                feign.Request.HttpMethod.GET,
                "/api/members/" + memberId,
                Collections.emptyMap(),
                null,
                java.nio.charset.StandardCharsets.UTF_8,
                null
        );
        FeignException.NotFound notFound = new FeignException.NotFound("Member not found", feignRequest, null, Collections.emptyMap());
        when(memberClient.getMemberById(memberId)).thenThrow(notFound);

        SubscriptionRequest request = new SubscriptionRequest(memberId, planId);

        assertThrows(ResourceNotFoundException.class, () -> subscriptionService.createSubscription(request));
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    void testCreateSubscriptionRejectInactiveMemberThrowsException() {
        Long memberId = 20L;
        Long planId = 1L;

        MemberDto memberDto = new MemberDto();
        memberDto.setMemberId(memberId);
        memberDto.setStatus("INACTIVE");
        when(memberClient.getMemberById(memberId)).thenReturn(memberDto);

        SubscriptionRequest request = new SubscriptionRequest(memberId, planId);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> subscriptionService.createSubscription(request));
        assertTrue(ex.getMessage().contains("INACTIVE"));
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    void testCreateSubscriptionRejectInvalidPlanThrowsException() {
        Long memberId = 1L;
        Long invalidPlanId = 999L;

        MemberDto memberDto = new MemberDto();
        memberDto.setMemberId(memberId);
        memberDto.setStatus("ACTIVE");
        when(memberClient.getMemberById(memberId)).thenReturn(memberDto);

        when(planRepository.findById(invalidPlanId)).thenReturn(Optional.empty());

        SubscriptionRequest request = new SubscriptionRequest(memberId, invalidPlanId);

        assertThrows(ResourceNotFoundException.class, () -> subscriptionService.createSubscription(request));
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    void testCreateSubscriptionRejectInactivePlanThrowsException() {
        Long memberId = 1L;
        Long planId = 2L;

        MemberDto memberDto = new MemberDto();
        memberDto.setMemberId(memberId);
        memberDto.setStatus("ACTIVE");
        when(memberClient.getMemberById(memberId)).thenReturn(memberDto);

        MembershipPlan inactivePlan = new MembershipPlan("Retired Plan", "Desc", 30, 20.0, false);
        inactivePlan.setPlanId(planId);
        when(planRepository.findById(planId)).thenReturn(Optional.of(inactivePlan));

        SubscriptionRequest request = new SubscriptionRequest(memberId, planId);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> subscriptionService.createSubscription(request));
        assertTrue(ex.getMessage().contains("inactive"));
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    void testCreateSubscriptionPreventOverlappingActiveSubscriptions() {
        Long memberId = 1L;
        Long planId = 1L;

        MemberDto memberDto = new MemberDto();
        memberDto.setMemberId(memberId);
        memberDto.setStatus("ACTIVE");
        when(memberClient.getMemberById(memberId)).thenReturn(memberDto);

        MembershipPlan plan = new MembershipPlan("Active Plan", "Desc", 30, 49.99, true);
        plan.setPlanId(planId);
        when(planRepository.findById(planId)).thenReturn(Optional.of(plan));

        Subscription existingActive = new Subscription(memberId, planId, LocalDate.now().minusDays(10), LocalDate.now().plusDays(20));
        existingActive.setSubscriptionId(55L);
        when(subscriptionRepository.findActiveSubscriptions(eq(memberId), any(LocalDate.class)))
                .thenReturn(List.of(existingActive));

        SubscriptionRequest request = new SubscriptionRequest(memberId, planId);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> subscriptionService.createSubscription(request));
        assertTrue(ex.getMessage().contains("Overlapping active subscriptions"));
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    void testRenewActiveSubscriptionExtendsFromExistingExpiryDate() {
        Long subId = 10L;
        Long planId = 1L;
        LocalDate currentExpiry = LocalDate.now().plusDays(15);

        Subscription activeSub = new Subscription(1L, planId, LocalDate.now().minusDays(15), currentExpiry, "ACTIVE");
        activeSub.setSubscriptionId(subId);

        MembershipPlan plan = new MembershipPlan("Monthly Plan", "Desc", 30, 49.99, true);
        plan.setPlanId(planId);

        when(subscriptionRepository.findById(subId)).thenReturn(Optional.of(activeSub));
        when(planRepository.findById(planId)).thenReturn(Optional.of(plan));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubscriptionResponse response = subscriptionService.renewSubscription(subId, new RenewalRequest());

        assertNotNull(response);
        assertEquals(currentExpiry.plusDays(30), response.getExpiryDate());
        assertEquals("ACTIVE", response.getStatus());
        verify(subscriptionRepository, times(1)).save(activeSub);
    }

    @Test
    void testRenewExpiredSubscriptionStartsFromCurrentDate() {
        Long subId = 20L;
        Long planId = 1L;
        LocalDate oldExpiry = LocalDate.now().minusDays(10);

        Subscription expiredSub = new Subscription(1L, planId, LocalDate.now().minusDays(40), oldExpiry, "EXPIRED");
        expiredSub.setSubscriptionId(subId);

        MembershipPlan plan = new MembershipPlan("Monthly Plan", "Desc", 30, 49.99, true);
        plan.setPlanId(planId);

        when(subscriptionRepository.findById(subId)).thenReturn(Optional.of(expiredSub));
        when(planRepository.findById(planId)).thenReturn(Optional.of(plan));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubscriptionResponse response = subscriptionService.renewSubscription(subId, new RenewalRequest());

        assertNotNull(response);
        assertEquals(LocalDate.now(), response.getStartDate());
        assertEquals(LocalDate.now().plusDays(30), response.getExpiryDate());
        assertEquals("ACTIVE", response.getStatus());
        verify(subscriptionRepository, times(1)).save(expiredSub);
    }

    @Test
    void testRenewSubscriptionNotFoundThrows404() {
        when(subscriptionRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> subscriptionService.renewSubscription(404L, new RenewalRequest()));
    }

    @Test
    void testGetSubscriptionByIdNotFoundThrows404() {
        when(subscriptionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> subscriptionService.getSubscriptionById(999L));
    }

    @Test
    void testVerifyExpiryDateCalculations() {
        LocalDate start = LocalDate.of(2026, 1, 1);
        int duration = 90;

        MemberDto member = new MemberDto();
        member.setMemberId(5L);
        member.setStatus("ACTIVE");
        when(memberClient.getMemberById(5L)).thenReturn(member);

        MembershipPlan plan = new MembershipPlan("Quarterly", "Desc", duration, 149.99, true);
        plan.setPlanId(3L);
        when(planRepository.findById(3L)).thenReturn(Optional.of(plan));
        when(subscriptionRepository.findActiveSubscriptions(eq(5L), eq(start))).thenReturn(Collections.emptyList());
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

        SubscriptionRequest request = new SubscriptionRequest(5L, 3L, start);
        SubscriptionResponse response = subscriptionService.createSubscription(request);

        assertEquals(LocalDate.of(2026, 4, 1), response.getExpiryDate());
    }

    @Test
    void testGetSubscriptionStatus() {
        Long subId = 50L;
        LocalDate expiry = LocalDate.now().plusDays(10);
        Subscription sub = new Subscription(1L, 1L, LocalDate.now().minusDays(20), expiry, "ACTIVE");
        sub.setSubscriptionId(subId);

        MembershipPlan plan = new MembershipPlan("Plan", "Desc", 30, 50.0, true);
        plan.setPlanId(1L);

        when(subscriptionRepository.findById(subId)).thenReturn(Optional.of(sub));
        when(planRepository.findById(1L)).thenReturn(Optional.of(plan));

        SubscriptionStatusResponse status = subscriptionService.getSubscriptionStatus(subId);
        assertNotNull(status);
        assertEquals(subId, status.getSubscriptionId());
        assertEquals("ACTIVE", status.getStatus());
        assertEquals(10L, status.getDaysRemaining());
        assertTrue(status.getIsValid());
        assertFalse(status.getIsExpired());
    }

    @Test
    void testAutomaticTransitionToExpiredWhenExpiryDatePassed() {
        Long subId = 60L;
        LocalDate pastExpiry = LocalDate.now().minusDays(2);
        Subscription sub = new Subscription(1L, 1L, LocalDate.now().minusDays(32), pastExpiry, "ACTIVE");
        sub.setSubscriptionId(subId);

        MembershipPlan plan = new MembershipPlan("Plan", "Desc", 30, 50.0, true);
        plan.setPlanId(1L);

        when(subscriptionRepository.findById(subId)).thenReturn(Optional.of(sub));
        when(planRepository.findById(1L)).thenReturn(Optional.of(plan));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

        SubscriptionStatusResponse status = subscriptionService.getSubscriptionStatus(subId);
        assertNotNull(status);
        assertEquals("EXPIRED", status.getStatus());
        assertFalse(status.getIsValid());
        assertTrue(status.getIsExpired());
        verify(subscriptionRepository, atLeastOnce()).save(sub);
    }

    @Test
    void testDeleteSubscriptionTransitionsStatusToCancelled() {
        Long subId = 70L;
        Subscription sub = new Subscription(1L, 1L, LocalDate.now().minusDays(5), LocalDate.now().plusDays(25), "ACTIVE");
        sub.setSubscriptionId(subId);

        when(subscriptionRepository.findById(subId)).thenReturn(Optional.of(sub));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

        subscriptionService.deleteSubscription(subId);

        assertEquals("CANCELLED", sub.getStatus(), "Status must be changed to CANCELLED");
        assertFalse(sub.isActive(), "Cancelled subscription must not be active");
        verify(subscriptionRepository, times(1)).save(sub);
    }

    @Test
    void testDeleteSubscriptionNotFoundThrows404() {
        when(subscriptionRepository.findById(999L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> subscriptionService.deleteSubscription(999L));
        assertTrue(ex.getMessage().contains("999"));
    }

    @Test
    void testCancelledSubscriptionNotReturnedAsActive() {
        Long memberId = 2L;
        // findActiveSubscriptions checks for status = 'ACTIVE', so cancelled subscriptions are not returned
        when(subscriptionRepository.findActiveSubscriptions(eq(memberId), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        Optional<SubscriptionResponse> activeSub = subscriptionService.getActiveSubscriptionForMember(memberId);
        assertFalse(activeSub.isPresent(), "Cancelled subscription must not be returned as active");
    }

    @Test
    void testCancelledSubscriptionPreservedInMemberHistory() {
        Long memberId = 3L;
        Subscription cancelledSub = new Subscription(memberId, 1L, LocalDate.now().minusDays(30), LocalDate.now().plusDays(0), "CANCELLED");
        cancelledSub.setSubscriptionId(88L);

        MembershipPlan plan = new MembershipPlan("Basic Monthly", "Desc", 30, 49.99, true);
        plan.setPlanId(1L);

        when(subscriptionRepository.findByMemberId(memberId)).thenReturn(List.of(cancelledSub));
        when(subscriptionRepository.findByMemberIdOrderByCreatedAtDesc(memberId)).thenReturn(List.of(cancelledSub));
        when(planRepository.findById(1L)).thenReturn(Optional.of(plan));

        List<SubscriptionResponse> history = subscriptionService.getSubscriptionsByMemberId(memberId);
        assertNotNull(history);
        assertEquals(1, history.size(), "History must preserve cancelled subscriptions");
        assertEquals("CANCELLED", history.get(0).getStatus());
    }

    @Test
    void testDeleteSubscriptionPermanentlyDeletesRecord() {
        Long subId = 99L;
        Subscription sub = new Subscription(1L, 1L, LocalDate.now().minusDays(5), LocalDate.now().plusDays(25), "ACTIVE");
        sub.setSubscriptionId(subId);

        when(subscriptionRepository.findById(subId)).thenReturn(Optional.of(sub));

        subscriptionService.deleteSubscriptionPermanently(subId);

        verify(subscriptionRepository, times(1)).delete(sub);
    }
}
