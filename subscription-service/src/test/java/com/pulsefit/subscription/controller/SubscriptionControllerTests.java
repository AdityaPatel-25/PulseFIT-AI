package com.pulsefit.subscription.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.pulsefit.subscription.client.MemberClient;
import com.pulsefit.subscription.dto.MemberDto;
import com.pulsefit.subscription.dto.RenewalRequest;
import com.pulsefit.subscription.dto.SubscriptionRequest;
import com.pulsefit.subscription.entity.MembershipPlan;
import com.pulsefit.subscription.entity.Subscription;
import com.pulsefit.subscription.exception.GlobalExceptionHandler;
import com.pulsefit.subscription.repository.MembershipPlanRepository;
import com.pulsefit.subscription.repository.SubscriptionRepository;
import com.pulsefit.subscription.service.SubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SubscriptionControllerTests {

    private MockMvc mockMvc;
    private SubscriptionRepository subscriptionRepository;
    private MembershipPlanRepository planRepository;
    private MemberClient memberClient;
    private SubscriptionService subscriptionService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        subscriptionRepository = Mockito.mock(SubscriptionRepository.class);
        planRepository = Mockito.mock(MembershipPlanRepository.class);
        memberClient = Mockito.mock(MemberClient.class);
        subscriptionService = new SubscriptionService(subscriptionRepository, planRepository, memberClient);

        SubscriptionController controller = new SubscriptionController(subscriptionService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void testCreateSubscriptionSuccessReturns201() throws Exception {
        SubscriptionRequest request = new SubscriptionRequest(1L, 2L, LocalDate.now());

        MemberDto member = new MemberDto();
        member.setMemberId(1L);
        member.setStatus("ACTIVE");
        when(memberClient.getMemberById(1L)).thenReturn(member);

        MembershipPlan plan = new MembershipPlan("Premium Quarterly", "Desc", 90, 149.99, true);
        plan.setPlanId(2L);
        when(planRepository.findById(2L)).thenReturn(Optional.of(plan));

        when(subscriptionRepository.findActiveSubscriptions(eq(1L), any(LocalDate.class))).thenReturn(Collections.emptyList());
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> {
            Subscription s = invocation.getArgument(0);
            s.setSubscriptionId(10L);
            return s;
        });

        mockMvc.perform(post("/api/subscriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.subscriptionId").value(10L))
                .andExpect(jsonPath("$.memberId").value(1L))
                .andExpect(jsonPath("$.planId").value(2L))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.currentlyValid").value(true));
    }

    @Test
    void testCreateSubscriptionValidationFailureReturns400() throws Exception {
        // Missing memberId and planId
        SubscriptionRequest invalidRequest = new SubscriptionRequest();

        mockMvc.perform(post("/api/subscriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.memberId").exists())
                .andExpect(jsonPath("$.errors.planId").exists());
    }

    @Test
    void testCreateSubscriptionMemberNotFoundReturns404() throws Exception {
        SubscriptionRequest request = new SubscriptionRequest(999L, 1L);

        when(memberClient.getMemberById(999L)).thenReturn(null);

        mockMvc.perform(post("/api/subscriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Member not found with ID: 999"));
    }

    @Test
    void testCreateSubscriptionOverlappingReturns400() throws Exception {
        SubscriptionRequest request = new SubscriptionRequest(1L, 1L);

        MemberDto member = new MemberDto();
        member.setMemberId(1L);
        member.setStatus("ACTIVE");
        when(memberClient.getMemberById(1L)).thenReturn(member);

        MembershipPlan plan = new MembershipPlan("Basic Monthly", "Desc", 30, 49.99, true);
        plan.setPlanId(1L);
        when(planRepository.findById(1L)).thenReturn(Optional.of(plan));

        Subscription existing = new Subscription(1L, 1L, LocalDate.now().minusDays(5), LocalDate.now().plusDays(25), "ACTIVE");
        existing.setSubscriptionId(5L);
        when(subscriptionRepository.findActiveSubscriptions(eq(1L), any(LocalDate.class)))
                .thenReturn(List.of(existing));

        mockMvc.perform(post("/api/subscriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Overlapping active subscriptions")));
    }

    @Test
    void testGetAllSubscriptionsReturns200() throws Exception {
        Subscription s1 = new Subscription(1L, 1L, LocalDate.now().minusDays(10), LocalDate.now().plusDays(20), "ACTIVE");
        s1.setSubscriptionId(1L);
        Subscription s2 = new Subscription(2L, 2L, LocalDate.now().minusDays(15), LocalDate.now().plusDays(75), "ACTIVE");
        s2.setSubscriptionId(2L);

        when(subscriptionRepository.findExpiredActiveSubscriptions(any(LocalDate.class))).thenReturn(Collections.emptyList());
        when(subscriptionRepository.findAll()).thenReturn(List.of(s1, s2));

        mockMvc.perform(get("/api/subscriptions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].subscriptionId").value(1L))
                .andExpect(jsonPath("$[1].subscriptionId").value(2L));
    }

    @Test
    void testGetSubscriptionByIdSuccessReturns200() throws Exception {
        Subscription sub = new Subscription(1L, 1L, LocalDate.now().minusDays(5), LocalDate.now().plusDays(25), "ACTIVE");
        sub.setSubscriptionId(10L);

        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(sub));

        mockMvc.perform(get("/api/subscriptions/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscriptionId").value(10L))
                .andExpect(jsonPath("$.memberId").value(1L));
    }

    @Test
    void testGetSubscriptionByIdNotFoundReturns404() throws Exception {
        when(subscriptionRepository.findById(404L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/subscriptions/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Subscription not found with ID: 404"));
    }

    @Test
    void testGetActiveSubscriptionForMemberFoundReturns200() throws Exception {
        Subscription sub = new Subscription(5L, 1L, LocalDate.now().minusDays(5), LocalDate.now().plusDays(25), "ACTIVE");
        sub.setSubscriptionId(1L);

        when(subscriptionRepository.findByMemberId(5L)).thenReturn(List.of(sub));
        when(subscriptionRepository.findActiveSubscriptions(eq(5L), any(LocalDate.class))).thenReturn(List.of(sub));

        mockMvc.perform(get("/api/subscriptions/member/5/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscriptionId").value(1L))
                .andExpect(jsonPath("$.memberId").value(5L))
                .andExpect(jsonPath("$.currentlyValid").value(true));
    }

    @Test
    void testGetActiveSubscriptionForMemberNotFoundReturns404() throws Exception {
        when(subscriptionRepository.findByMemberId(99L)).thenReturn(Collections.emptyList());
        when(subscriptionRepository.findActiveSubscriptions(eq(99L), any(LocalDate.class))).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/subscriptions/member/99/active"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.memberId").value(99L))
                .andExpect(jsonPath("$.hasActiveSubscription").value(false));
    }

    @Test
    void testRenewSubscriptionSuccessReturns200() throws Exception {
        RenewalRequest renewal = new RenewalRequest(1L);

        Subscription sub = new Subscription(1L, 1L, LocalDate.now().minusDays(10), LocalDate.now().plusDays(20), "ACTIVE");
        sub.setSubscriptionId(5L);

        MembershipPlan plan = new MembershipPlan("Basic Monthly", "Desc", 30, 49.99, true);
        plan.setPlanId(1L);

        when(subscriptionRepository.findById(5L)).thenReturn(Optional.of(sub));
        when(planRepository.findById(1L)).thenReturn(Optional.of(plan));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/subscriptions/5/renew")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(renewal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscriptionId").value(5L))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void testGetSubscriptionStatusSuccessReturns200() throws Exception {
        Subscription sub = new Subscription(1L, 2L, LocalDate.now().minusDays(10), LocalDate.now().plusDays(80), "ACTIVE");
        sub.setSubscriptionId(10L);

        MembershipPlan plan = new MembershipPlan("Premium Quarterly", "Desc", 90, 149.99, true);
        plan.setPlanId(2L);

        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(sub));
        when(planRepository.findById(2L)).thenReturn(Optional.of(plan));

        mockMvc.perform(get("/api/subscriptions/10/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscriptionId").value(10L))
                .andExpect(jsonPath("$.planName").value("Premium Quarterly"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.daysRemaining").value(80))
                .andExpect(jsonPath("$.isValid").value(true))
                .andExpect(jsonPath("$.isExpired").value(false));
    }

    @Test
    void testDeleteSubscriptionSuccessReturns204NoContent() throws Exception {
        Subscription sub = new Subscription(1L, 1L, LocalDate.now().minusDays(5), LocalDate.now().plusDays(25), "ACTIVE");
        sub.setSubscriptionId(15L);

        when(subscriptionRepository.findById(15L)).thenReturn(Optional.of(sub));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

        mockMvc.perform(delete("/api/subscriptions/15"))
                .andExpect(status().isNoContent());

        assertEquals("CANCELLED", sub.getStatus(), "Subscription status must be transitioned to CANCELLED");
        verify(subscriptionRepository, times(1)).save(sub);
    }

    @Test
    void testDeleteSubscriptionNotFoundReturns404() throws Exception {
        when(subscriptionRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/subscriptions/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Subscription not found with ID: 999"));
    }

    @Test
    void testDeleteSubscriptionHardDeleteSuccessReturns204NoContent() throws Exception {
        Subscription sub = new Subscription(1L, 1L, LocalDate.now().minusDays(5), LocalDate.now().plusDays(25), "ACTIVE");
        sub.setSubscriptionId(16L);

        when(subscriptionRepository.findById(16L)).thenReturn(Optional.of(sub));

        mockMvc.perform(delete("/api/subscriptions/16?hard=true"))
                .andExpect(status().isNoContent());

        verify(subscriptionRepository, times(1)).delete(sub);
    }
}
