package com.pulsefit.subscription.service;

import com.pulsefit.subscription.dto.MembershipPlanRequest;
import com.pulsefit.subscription.dto.MembershipPlanResponse;
import com.pulsefit.subscription.entity.MembershipPlan;
import com.pulsefit.subscription.exception.DuplicateResourceException;
import com.pulsefit.subscription.exception.ResourceNotFoundException;
import com.pulsefit.subscription.repository.MembershipPlanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MembershipPlanServiceTests {

    private MembershipPlanRepository planRepository;
    private MembershipPlanService planService;

    @BeforeEach
    void setUp() {
        planRepository = Mockito.mock(MembershipPlanRepository.class);
        planService = new MembershipPlanService(planRepository);
    }

    @Test
    void testCreatePlanSuccess() {
        MembershipPlanRequest request = new MembershipPlanRequest("Gold Monthly", "Access to all facilities", 30, 79.99, true);
        MembershipPlan plan = new MembershipPlan("Gold Monthly", "Access to all facilities", 30, 79.99, true);
        plan.setPlanId(1L);

        when(planRepository.existsByPlanNameIgnoreCase("Gold Monthly")).thenReturn(false);
        when(planRepository.save(any(MembershipPlan.class))).thenReturn(plan);

        MembershipPlanResponse response = planService.createPlan(request);
        assertNotNull(response);
        assertEquals(1L, response.getPlanId());
        assertEquals("Gold Monthly", response.getPlanName());
        assertEquals(30, response.getDurationInDays());
        assertEquals(79.99, response.getPrice());
        assertTrue(response.getActive());
        verify(planRepository, times(1)).save(any(MembershipPlan.class));
    }

    @Test
    void testCreatePlanDuplicateNameThrowsException() {
        MembershipPlanRequest request = new MembershipPlanRequest("Gold Monthly", "Access to all facilities", 30, 79.99, true);
        when(planRepository.existsByPlanNameIgnoreCase("Gold Monthly")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> planService.createPlan(request));
        verify(planRepository, never()).save(any(MembershipPlan.class));
    }

    @Test
    void testGetAllPlans() {
        MembershipPlan p1 = new MembershipPlan("Plan 1", "Desc 1", 30, 49.99, true);
        p1.setPlanId(1L);
        MembershipPlan p2 = new MembershipPlan("Plan 2", "Desc 2", 90, 129.99, true);
        p2.setPlanId(2L);

        when(planRepository.findAll()).thenReturn(List.of(p1, p2));

        List<MembershipPlanResponse> all = planService.getAllPlans();
        assertEquals(2, all.size());
        assertEquals("Plan 1", all.get(0).getPlanName());
        assertEquals("Plan 2", all.get(1).getPlanName());
    }

    @Test
    void testGetPlanByIdSuccess() {
        MembershipPlan plan = new MembershipPlan("Silver Plan", "Standard access", 60, 99.99, true);
        plan.setPlanId(5L);

        when(planRepository.findById(5L)).thenReturn(Optional.of(plan));

        MembershipPlanResponse response = planService.getPlanById(5L);
        assertNotNull(response);
        assertEquals(5L, response.getPlanId());
        assertEquals("Silver Plan", response.getPlanName());
    }

    @Test
    void testGetPlanByIdNotFoundThrowsException() {
        when(planRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> planService.getPlanById(999L));
    }

    @Test
    void testUpdatePlanSuccess() {
        MembershipPlan existing = new MembershipPlan("Old Plan", "Old Desc", 30, 40.0, true);
        existing.setPlanId(1L);

        MembershipPlanRequest updateReq = new MembershipPlanRequest("Updated Plan", "New Desc", 45, 55.0, true);

        when(planRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(planRepository.existsByPlanNameIgnoreCaseAndPlanIdNot("Updated Plan", 1L)).thenReturn(false);
        when(planRepository.save(any(MembershipPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MembershipPlanResponse response = planService.updatePlan(1L, updateReq);
        assertNotNull(response);
        assertEquals("Updated Plan", response.getPlanName());
        assertEquals("New Desc", response.getDescription());
        assertEquals(45, response.getDurationInDays());
        assertEquals(55.0, response.getPrice());
    }

    @Test
    void testUpdatePlanDuplicateNameThrowsException() {
        MembershipPlan existing = new MembershipPlan("Old Plan", "Old Desc", 30, 40.0, true);
        existing.setPlanId(1L);

        MembershipPlanRequest updateReq = new MembershipPlanRequest("Conflict Name", "New Desc", 45, 55.0, true);

        when(planRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(planRepository.existsByPlanNameIgnoreCaseAndPlanIdNot("Conflict Name", 1L)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> planService.updatePlan(1L, updateReq));
        verify(planRepository, never()).save(any(MembershipPlan.class));
    }

    @Test
    void testUpdatePlanNotFoundThrowsException() {
        MembershipPlanRequest updateReq = new MembershipPlanRequest("Updated Plan", "New Desc", 45, 55.0, true);
        when(planRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> planService.updatePlan(404L, updateReq));
    }

    @Test
    void testDeactivatePlanSuccess() {
        MembershipPlan existing = new MembershipPlan("Active Plan", "Desc", 30, 49.99, true);
        existing.setPlanId(2L);

        when(planRepository.findById(2L)).thenReturn(Optional.of(existing));
        when(planRepository.save(any(MembershipPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MembershipPlanResponse response = planService.deactivatePlan(2L);
        assertNotNull(response);
        assertFalse(response.getActive());
        assertFalse(existing.getActive());
        verify(planRepository, times(1)).save(existing);
    }

    @Test
    void testDeactivatePlanNotFoundThrowsException() {
        when(planRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> planService.deactivatePlan(404L));
    }
}
