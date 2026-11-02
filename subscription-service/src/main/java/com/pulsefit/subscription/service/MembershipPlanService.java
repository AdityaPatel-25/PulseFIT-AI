package com.pulsefit.subscription.service;

import com.pulsefit.subscription.dto.MembershipPlanRequest;
import com.pulsefit.subscription.dto.MembershipPlanResponse;
import com.pulsefit.subscription.entity.MembershipPlan;
import com.pulsefit.subscription.exception.DuplicateResourceException;
import com.pulsefit.subscription.exception.ResourceNotFoundException;
import com.pulsefit.subscription.repository.MembershipPlanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class MembershipPlanService {

    private static final Logger log = LoggerFactory.getLogger(MembershipPlanService.class);

    private final MembershipPlanRepository membershipPlanRepository;

    public MembershipPlanService(MembershipPlanRepository membershipPlanRepository) {
        this.membershipPlanRepository = membershipPlanRepository;
    }

    public MembershipPlanResponse createPlan(MembershipPlanRequest request) {
        log.info("Creating membership plan with name: '{}'", request.getPlanName());

        if (membershipPlanRepository.existsByPlanNameIgnoreCase(request.getPlanName().trim())) {
            throw new DuplicateResourceException("Membership plan with name '" + request.getPlanName() + "' already exists");
        }

        MembershipPlan plan = new MembershipPlan(
                request.getPlanName().trim(),
                request.getDescription(),
                request.getDurationInDays(),
                request.getPrice(),
                request.getActive() != null ? request.getActive() : true
        );

        MembershipPlan saved = membershipPlanRepository.save(plan);
        log.info("Successfully created membership plan ID: {}", saved.getPlanId());
        return MembershipPlanResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<MembershipPlanResponse> getAllPlans() {
        return membershipPlanRepository.findAll().stream()
                .map(MembershipPlanResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MembershipPlanResponse getPlanById(Long planId) {
        MembershipPlan plan = membershipPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership plan not found with ID: " + planId));
        return MembershipPlanResponse.fromEntity(plan);
    }

    public MembershipPlanResponse updatePlan(Long planId, MembershipPlanRequest request) {
        log.info("Updating membership plan ID: {}", planId);

        MembershipPlan plan = membershipPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership plan not found with ID: " + planId));

        if (membershipPlanRepository.existsByPlanNameIgnoreCaseAndPlanIdNot(request.getPlanName().trim(), planId)) {
            throw new DuplicateResourceException("Another membership plan with name '" + request.getPlanName() + "' already exists");
        }

        plan.setPlanName(request.getPlanName().trim());
        plan.setDescription(request.getDescription());
        plan.setDurationInDays(request.getDurationInDays());
        plan.setPrice(request.getPrice());
        if (request.getActive() != null) {
            plan.setActive(request.getActive());
        }

        MembershipPlan updated = membershipPlanRepository.save(plan);
        log.info("Successfully updated membership plan ID: {}", updated.getPlanId());
        return MembershipPlanResponse.fromEntity(updated);
    }

    public MembershipPlanResponse deactivatePlan(Long planId) {
        log.info("Deactivating membership plan ID: {}", planId);

        MembershipPlan plan = membershipPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership plan not found with ID: " + planId));

        plan.setActive(false);
        MembershipPlan saved = membershipPlanRepository.save(plan);
        log.info("Successfully deactivated membership plan ID: {}", saved.getPlanId());
        return MembershipPlanResponse.fromEntity(saved);
    }
}
