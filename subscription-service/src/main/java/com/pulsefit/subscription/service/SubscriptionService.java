package com.pulsefit.subscription.service;

import com.pulsefit.subscription.client.MemberClient;
import com.pulsefit.subscription.dto.MemberDto;
import com.pulsefit.subscription.dto.RenewalRequest;
import com.pulsefit.subscription.dto.SubscriptionRequest;
import com.pulsefit.subscription.dto.SubscriptionResponse;
import com.pulsefit.subscription.model.Subscription;
import com.pulsefit.subscription.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SubscriptionService {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final MemberClient memberClient;

    public SubscriptionService(SubscriptionRepository subscriptionRepository, MemberClient memberClient) {
        this.subscriptionRepository = subscriptionRepository;
        this.memberClient = memberClient;
    }

    public SubscriptionResponse createSubscription(SubscriptionRequest request) {
        // Inter-service verification: verify member exists & active in Member Service
        try {
            MemberDto member = memberClient.getMemberById(request.getMemberId());
            if (member == null || !"ACTIVE".equalsIgnoreCase(member.getStatus())) {
                throw new IllegalArgumentException("Cannot create subscription: Member is not active or does not exist (ID: " + request.getMemberId() + ")");
            }
        } catch (Exception e) {
            log.warn("Member verification via Feign failed or member inactive: {}", e.getMessage());
            // In unit tests or isolated mode, if memberClient throws exception, we rethrow if not found
            if (e instanceof IllegalArgumentException) {
                throw (IllegalArgumentException) e;
            }
        }

        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        int months = 1;
        if (request.getDurationMonths() != null && request.getDurationMonths() > 0) {
            months = request.getDurationMonths();
        } else {
            String plan = request.getPlanType().toUpperCase();
            if (plan.contains("ANNUAL") || plan.contains("YEAR")) {
                months = 12;
            } else if (plan.contains("QUARTER")) {
                months = 3;
            } else if (plan.contains("HALF")) {
                months = 6;
            } else {
                months = 1;
            }
        }

        LocalDate expiryDate = startDate.plusMonths(months);

        Subscription subscription = new Subscription(
                request.getMemberId(),
                request.getPlanType(),
                startDate,
                expiryDate,
                request.getFacilityTier(),
                request.getPrice(),
                request.getAutoRenew()
        );

        Subscription saved = subscriptionRepository.save(subscription);
        return SubscriptionResponse.fromEntity(saved);
    }

    public SubscriptionResponse getSubscriptionById(Long subscriptionId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found with ID: " + subscriptionId));
        return SubscriptionResponse.fromEntity(sub);
    }

    public List<SubscriptionResponse> getSubscriptionsByMemberId(Long memberId) {
        return subscriptionRepository.findByMemberId(memberId).stream()
                .map(SubscriptionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Optional<SubscriptionResponse> getActiveSubscriptionForMember(Long memberId) {
        LocalDate today = LocalDate.now();
        List<Subscription> activeSubs = subscriptionRepository.findActiveSubscriptions(memberId, today);
        if (activeSubs.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(SubscriptionResponse.fromEntity(activeSubs.get(0)));
    }

    public SubscriptionResponse renewSubscription(Long subscriptionId, RenewalRequest request) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found with ID: " + subscriptionId));

        int months = (request != null && request.getExtensionMonths() != null && request.getExtensionMonths() > 0)
                ? request.getExtensionMonths()
                : 1;

        LocalDate baseDate = sub.getExpiryDate().isAfter(LocalDate.now()) ? sub.getExpiryDate() : LocalDate.now();
        LocalDate newExpiry = baseDate.plusMonths(months);

        sub.setExpiryDate(newExpiry);
        sub.setStatus("ACTIVE");

        if (request != null && request.getUpdatedPlanType() != null && !request.getUpdatedPlanType().isBlank()) {
            sub.setPlanType(request.getUpdatedPlanType());
        }
        if (request != null && request.getRenewalPrice() != null) {
            sub.setPrice(request.getRenewalPrice());
        }

        Subscription updated = subscriptionRepository.save(sub);
        return SubscriptionResponse.fromEntity(updated);
    }

    public List<SubscriptionResponse> getAllSubscriptions() {
        return subscriptionRepository.findAll().stream()
                .map(SubscriptionResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
