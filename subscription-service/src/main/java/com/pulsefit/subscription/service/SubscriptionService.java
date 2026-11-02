package com.pulsefit.subscription.service;

import com.pulsefit.subscription.client.MemberClient;
import com.pulsefit.subscription.dto.*;
import com.pulsefit.subscription.entity.MembershipPlan;
import com.pulsefit.subscription.entity.Subscription;
import com.pulsefit.subscription.exception.ResourceNotFoundException;
import com.pulsefit.subscription.repository.MembershipPlanRepository;
import com.pulsefit.subscription.repository.SubscriptionRepository;
import feign.FeignException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class SubscriptionService {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final MembershipPlanRepository membershipPlanRepository;
    private final MemberClient memberClient;

    public SubscriptionService(SubscriptionRepository subscriptionRepository,
                               MembershipPlanRepository membershipPlanRepository,
                               MemberClient memberClient) {
        this.subscriptionRepository = subscriptionRepository;
        this.membershipPlanRepository = membershipPlanRepository;
        this.memberClient = memberClient;
    }

    /**
     * Create a new subscription for a member and plan.
     * Enforces member existence, plan active validation, and prevents overlapping active subscriptions.
     */
    public SubscriptionResponse createSubscription(SubscriptionRequest request) {
        log.info("Creating subscription for Member ID: {}, Plan ID: {}", request.getMemberId(), request.getPlanId());

        // 1. Verify member exists and is active via Member Service (Eureka Feign Client)
        verifyMemberExists(request.getMemberId());

        // 2. Resolve and validate membership plan
        MembershipPlan plan = resolveMembershipPlan(request);
        if (!Boolean.TRUE.equals(plan.getActive())) {
            log.warn("Attempted subscription to inactive plan ID: {}", plan.getPlanId());
            throw new IllegalArgumentException("Cannot create subscription with inactive membership plan: " + plan.getPlanName());
        }

        // 3. Prevent overlapping active subscriptions for the same member
        LocalDate effectiveStartDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        refreshMemberSubscriptions(request.getMemberId());

        List<Subscription> existingActive = subscriptionRepository.findActiveSubscriptions(request.getMemberId(), effectiveStartDate);
        if (!existingActive.isEmpty()) {
            Subscription activeSub = existingActive.get(0);
            log.warn("Member ID: {} already has active subscription ID: {} expiring on {}",
                    request.getMemberId(), activeSub.getSubscriptionId(), activeSub.getExpiryDate());
            throw new IllegalArgumentException("Member already has an active subscription (ID: "
                    + activeSub.getSubscriptionId() + ") expiring on " + activeSub.getExpiryDate()
                    + ". Overlapping active subscriptions are not allowed.");
        }

        // 4. Calculate expiryDate based on the plan duration in days
        LocalDate expiryDate = effectiveStartDate.plusDays(plan.getDurationInDays());

        // 5. Construct and persist Subscription entity
        Subscription subscription = new Subscription(
                request.getMemberId(),
                plan.getPlanId(),
                effectiveStartDate,
                expiryDate,
                "ACTIVE"
        );
        subscription.setPlan(plan);

        Subscription saved = subscriptionRepository.save(subscription);
        log.info("Subscription created successfully ID: {} for Member: {}, Expires on: {}",
                saved.getSubscriptionId(), saved.getMemberId(), saved.getExpiryDate());

        return SubscriptionResponse.fromEntity(saved, plan);
    }

    /**
     * Renew an existing subscription.
     * If active, extends from existing expiry date.
     * If expired, calculates new start date from current date.
     */
    public SubscriptionResponse renewSubscription(Long subscriptionId, RenewalRequest request) {
        log.info("Renewing subscription ID: {}", subscriptionId);

        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + subscriptionId));

        // Determine plan for renewal: use request planId if specified, otherwise keep current plan
        MembershipPlan plan;
        if (request != null && request.getPlanId() != null) {
            plan = membershipPlanRepository.findById(request.getPlanId())
                    .orElseThrow(() -> new ResourceNotFoundException("Membership plan not found with ID: " + request.getPlanId()));
        } else {
            plan = membershipPlanRepository.findById(sub.getPlanId())
                    .orElseThrow(() -> new ResourceNotFoundException("Membership plan not found with ID: " + sub.getPlanId()));
        }

        if (!Boolean.TRUE.equals(plan.getActive())) {
            throw new IllegalArgumentException("Cannot renew subscription with inactive membership plan: " + plan.getPlanName());
        }

        LocalDate today = LocalDate.now();
        int extensionDays = plan.getDurationInDays();
        if (request != null && request.getExtensionDays() != null && request.getExtensionDays() > 0) {
            extensionDays = request.getExtensionDays();
        }

        // Renewal Business Rule:
        // - Active: extend from existing expiry date
        // - Expired: start from current date
        if (sub.getExpiryDate() != null && !sub.getExpiryDate().isBefore(today)) {
            LocalDate newExpiry = sub.getExpiryDate().plusDays(extensionDays);
            log.info("Active subscription ID: {} extended from {} to {}", sub.getSubscriptionId(), sub.getExpiryDate(), newExpiry);
            sub.setExpiryDate(newExpiry);
            sub.setStatus("ACTIVE");
        } else {
            LocalDate newStartDate = today;
            LocalDate newExpiry = newStartDate.plusDays(extensionDays);
            log.info("Expired subscription ID: {} renewed from today {} until {}", sub.getSubscriptionId(), newStartDate, newExpiry);
            sub.setStartDate(newStartDate);
            sub.setExpiryDate(newExpiry);
            sub.setStatus("ACTIVE");
        }

        sub.setPlanId(plan.getPlanId());
        sub.setPlan(plan);

        Subscription updated = subscriptionRepository.save(sub);
        return SubscriptionResponse.fromEntity(updated, plan);
    }

    /**
     * Retrieve subscription by ID, auto-refreshing expired status.
     */
    public SubscriptionResponse getSubscriptionById(Long subscriptionId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + subscriptionId));

        refreshSubscriptionStatus(sub);
        MembershipPlan plan = membershipPlanRepository.findById(sub.getPlanId()).orElse(null);
        return SubscriptionResponse.fromEntity(sub, plan);
    }

    /**
     * Retrieve all subscriptions for a specific member.
     */
    public List<SubscriptionResponse> getSubscriptionsByMemberId(Long memberId) {
        refreshMemberSubscriptions(memberId);
        return subscriptionRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream()
                .map(sub -> {
                    MembershipPlan plan = membershipPlanRepository.findById(sub.getPlanId()).orElse(null);
                    return SubscriptionResponse.fromEntity(sub, plan);
                })
                .collect(Collectors.toList());
    }

    /**
     * Retrieve the currently active subscription for a member.
     */
    public Optional<SubscriptionResponse> getActiveSubscriptionForMember(Long memberId) {
        refreshMemberSubscriptions(memberId);
        List<Subscription> activeList = subscriptionRepository.findActiveSubscriptions(memberId, LocalDate.now());
        if (activeList.isEmpty()) {
            return Optional.empty();
        }
        Subscription active = activeList.get(0);
        MembershipPlan plan = membershipPlanRepository.findById(active.getPlanId()).orElse(null);
        return Optional.of(SubscriptionResponse.fromEntity(active, plan));
    }

    /**
     * Retrieve all subscriptions across the system.
     */
    public List<SubscriptionResponse> getAllSubscriptions() {
        refreshAllExpiredSubscriptions();
        return subscriptionRepository.findAll().stream()
                .map(sub -> {
                    MembershipPlan plan = membershipPlanRepository.findById(sub.getPlanId()).orElse(null);
                    return SubscriptionResponse.fromEntity(sub, plan);
                })
                .collect(Collectors.toList());
    }

    /**
     * Retrieve detailed status for a subscription.
     */
    public SubscriptionStatusResponse getSubscriptionStatus(Long subscriptionId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + subscriptionId));

        refreshSubscriptionStatus(sub);
        MembershipPlan plan = membershipPlanRepository.findById(sub.getPlanId()).orElse(null);
        String planName = plan != null ? plan.getPlanName() : sub.getPlanType();

        LocalDate today = LocalDate.now();
        boolean isExpired = sub.getExpiryDate().isBefore(today);
        boolean isValid = "ACTIVE".equalsIgnoreCase(sub.getStatus()) && !isExpired;

        long daysRemaining = ChronoUnit.DAYS.between(today, sub.getExpiryDate());
        if (daysRemaining < 0) {
            daysRemaining = 0;
        }

        return new SubscriptionStatusResponse(
                sub.getSubscriptionId(),
                sub.getMemberId(),
                sub.getPlanId(),
                planName,
                sub.getStatus(),
                sub.getStartDate(),
                sub.getExpiryDate(),
                daysRemaining,
                isValid,
                isExpired
        );
    }

    /**
     * Automatically update expired subscriptions.
     */
    public void refreshAllExpiredSubscriptions() {
        List<Subscription> expiredList = subscriptionRepository.findExpiredActiveSubscriptions(LocalDate.now());
        for (Subscription sub : expiredList) {
            sub.setStatus("EXPIRED");
        }
        if (!expiredList.isEmpty()) {
            subscriptionRepository.saveAll(expiredList);
            log.info("Automatically transitioned {} subscriptions to EXPIRED", expiredList.size());
        }
    }

    public void refreshMemberSubscriptions(Long memberId) {
        List<Subscription> subs = subscriptionRepository.findByMemberId(memberId);
        LocalDate today = LocalDate.now();
        for (Subscription sub : subs) {
            if ("ACTIVE".equalsIgnoreCase(sub.getStatus()) && sub.getExpiryDate().isBefore(today)) {
                sub.setStatus("EXPIRED");
                subscriptionRepository.save(sub);
            }
        }
    }

    private void refreshSubscriptionStatus(Subscription sub) {
        if ("ACTIVE".equalsIgnoreCase(sub.getStatus()) && sub.getExpiryDate().isBefore(LocalDate.now())) {
            sub.setStatus("EXPIRED");
            subscriptionRepository.save(sub);
        }
    }

    /**
     * Verifies member existence by calling Member Service via Feign.
     */
    private void verifyMemberExists(Long memberId) {
        try {
            MemberDto member = memberClient.getMemberById(memberId);
            if (member == null) {
                throw new ResourceNotFoundException("Member not found with ID: " + memberId);
            }
            if ("INACTIVE".equalsIgnoreCase(member.getStatus())) {
                throw new IllegalArgumentException("Cannot create subscription: Member is INACTIVE (ID: " + memberId + ")");
            }
        } catch (FeignException.NotFound e) {
            log.warn("Member Service responded 404 for memberId: {}", memberId);
            throw new ResourceNotFoundException("Member not found in Member Service with ID: " + memberId);
        } catch (ResourceNotFoundException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Inter-service call to Member Service encountered error: {}", e.getMessage());
            throw new IllegalArgumentException("Unable to verify member existence with Member Service: " + e.getMessage());
        }
    }

    /**
     * Helper to resolve plan by planId or backwards-compatible planName/planType.
     */
    private MembershipPlan resolveMembershipPlan(SubscriptionRequest request) {
        if (request.getPlanId() != null) {
            return membershipPlanRepository.findById(request.getPlanId())
                    .orElseThrow(() -> new ResourceNotFoundException("Membership plan not found with ID: " + request.getPlanId()));
        }

        if (request.getPlanType() != null && !request.getPlanType().isBlank()) {
            return membershipPlanRepository.findByPlanNameIgnoreCase(request.getPlanType())
                    .orElseThrow(() -> new ResourceNotFoundException("Membership plan not found with type: " + request.getPlanType()));
        }

        throw new IllegalArgumentException("Membership plan ID is required to create a subscription");
    }

    /**
     * Cancel or soft-delete a subscription by ID.
     * Transitions subscription status to CANCELLED, immediately invalidating facility
     * turnstile access while preserving the complete audit history for member records.
     */
    public void deleteSubscription(Long subscriptionId) {
        log.info("Cancelling / deleting subscription ID: {}", subscriptionId);
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + subscriptionId));

        sub.setStatus("CANCELLED");
        subscriptionRepository.save(sub);
        log.info("Subscription ID: {} transitioned to CANCELLED successfully", subscriptionId);
    }

    /**
     * Permanently delete a subscription record from the database.
     * Used when hard deletion is explicitly requested.
     */
    public void deleteSubscriptionPermanently(Long subscriptionId) {
        log.info("Permanently deleting subscription record ID: {}", subscriptionId);
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + subscriptionId));

        subscriptionRepository.delete(sub);
        log.info("Subscription ID: {} permanently deleted from database", subscriptionId);
    }
}
