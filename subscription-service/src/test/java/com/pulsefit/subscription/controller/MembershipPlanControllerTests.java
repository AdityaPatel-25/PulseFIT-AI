package com.pulsefit.subscription.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pulsefit.subscription.dto.MembershipPlanRequest;
import com.pulsefit.subscription.entity.MembershipPlan;
import com.pulsefit.subscription.exception.GlobalExceptionHandler;
import com.pulsefit.subscription.repository.MembershipPlanRepository;
import com.pulsefit.subscription.service.MembershipPlanService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MembershipPlanControllerTests {

    private MockMvc mockMvc;
    private MembershipPlanRepository planRepository;
    private MembershipPlanService planService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        planRepository = Mockito.mock(MembershipPlanRepository.class);
        planService = new MembershipPlanService(planRepository);
        MembershipPlanController controller = new MembershipPlanController(planService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void testCreatePlanSuccessReturns201() throws Exception {
        MembershipPlanRequest request = new MembershipPlanRequest("Gold Monthly", "Standard Pass", 30, 49.99, true);

        when(planRepository.existsByPlanNameIgnoreCase("Gold Monthly")).thenReturn(false);
        when(planRepository.save(any(MembershipPlan.class))).thenAnswer(invocation -> {
            MembershipPlan p = invocation.getArgument(0);
            p.setPlanId(1L);
            return p;
        });

        mockMvc.perform(post("/api/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.planId").value(1L))
                .andExpect(jsonPath("$.planName").value("Gold Monthly"))
                .andExpect(jsonPath("$.durationInDays").value(30))
                .andExpect(jsonPath("$.price").value(49.99))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void testCreatePlanValidationFailureReturns400() throws Exception {
        // Missing planName, duration <= 0, price <= 0
        MembershipPlanRequest invalidRequest = new MembershipPlanRequest("", "Invalid", 0, 0.0, true);

        mockMvc.perform(post("/api/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.planName").exists())
                .andExpect(jsonPath("$.errors.durationInDays").exists())
                .andExpect(jsonPath("$.errors.price").exists());
    }

    @Test
    void testGetAllPlansReturns200() throws Exception {
        MembershipPlan p1 = new MembershipPlan("Plan 1", "D1", 30, 49.99, true);
        p1.setPlanId(1L);
        MembershipPlan p2 = new MembershipPlan("Plan 2", "D2", 90, 129.99, true);
        p2.setPlanId(2L);

        when(planRepository.findAll()).thenReturn(List.of(p1, p2));

        mockMvc.perform(get("/api/plans"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].planName").value("Plan 1"))
                .andExpect(jsonPath("$[1].planName").value("Plan 2"));
    }

    @Test
    void testGetPlanByIdSuccessReturns200() throws Exception {
        MembershipPlan plan = new MembershipPlan("Gold Monthly", "Desc", 30, 49.99, true);
        plan.setPlanId(1L);

        when(planRepository.findById(1L)).thenReturn(Optional.of(plan));

        mockMvc.perform(get("/api/plans/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.planId").value(1L))
                .andExpect(jsonPath("$.planName").value("Gold Monthly"));
    }

    @Test
    void testGetPlanByIdNotFoundReturns404() throws Exception {
        when(planRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/plans/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Membership plan not found with ID: 999"));
    }

    @Test
    void testUpdatePlanSuccessReturns200() throws Exception {
        MembershipPlan existing = new MembershipPlan("Gold Monthly", "Desc", 30, 49.99, true);
        existing.setPlanId(1L);

        MembershipPlanRequest request = new MembershipPlanRequest("Updated Gold", "Updated Desc", 45, 59.99, true);

        when(planRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(planRepository.existsByPlanNameIgnoreCaseAndPlanIdNot("Updated Gold", 1L)).thenReturn(false);
        when(planRepository.save(any(MembershipPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/plans/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.planName").value("Updated Gold"))
                .andExpect(jsonPath("$.durationInDays").value(45));
    }

    @Test
    void testDeactivatePlanSuccessReturns200() throws Exception {
        MembershipPlan existing = new MembershipPlan("Gold", "Desc", 30, 49.99, true);
        existing.setPlanId(1L);

        when(planRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(planRepository.save(any(MembershipPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(delete("/api/plans/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Membership plan safely deactivated"))
                .andExpect(jsonPath("$.planId").value(1L))
                .andExpect(jsonPath("$.active").value(false));
    }
}
