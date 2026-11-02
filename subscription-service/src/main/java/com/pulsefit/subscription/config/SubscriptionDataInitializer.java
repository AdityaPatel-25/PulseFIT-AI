package com.pulsefit.subscription.config;

import com.pulsefit.subscription.entity.MembershipPlan;
import com.pulsefit.subscription.entity.Subscription;
import com.pulsefit.subscription.repository.MembershipPlanRepository;
import com.pulsefit.subscription.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;

@Configuration
public class SubscriptionDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionDataInitializer.class);

    private final MembershipPlanRepository membershipPlanRepository;
    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionDataInitializer(MembershipPlanRepository membershipPlanRepository,
                                       SubscriptionRepository subscriptionRepository) {
        this.membershipPlanRepository = membershipPlanRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @Override
    public void run(String... args) {
        seedMembershipPlans();
        seedSubscriptions();
    }

    private void seedMembershipPlans() {
        if (membershipPlanRepository.count() == 0) {
            log.info("Seeding initial PulseFit Membership Plans...");

            MembershipPlan basicMonthly = new MembershipPlan(
                    "Basic Monthly",
                    "Standard single facility monthly pass with general gym floor and locker room access",
                    30,
                    49.99,
                    true
            );

            MembershipPlan premiumQuarterly = new MembershipPlan(
                    "Premium Quarterly",
                    "Multi-facility quarterly pass with all group classes and sauna included",
                    90,
                    149.99,
                    true
            );

            MembershipPlan annualVip = new MembershipPlan(
                    "All-Access Annual VIP",
                    "Full multi-club access, private VIP locker, unlimited guest privileges, and recovery lounge",
                    365,
                    599.99,
                    true
            );

            MembershipPlan weekendFlex = new MembershipPlan(
                    "Weekend Flex Pass (Inactive)",
                    "Archived promotional weekend pass",
                    30,
                    29.99,
                    false
            );

            membershipPlanRepository.save(basicMonthly);
            membershipPlanRepository.save(premiumQuarterly);
            membershipPlanRepository.save(annualVip);
            membershipPlanRepository.save(weekendFlex);

            log.info("Sample membership plans seeded: Basic Monthly (30d), Premium Quarterly (90d), All-Access Annual VIP (365d), Weekend Flex (Inactive)");
        }
    }

    private void seedSubscriptions() {
        if (subscriptionRepository.count() == 0) {
            log.info("Seeding initial PulseFit Subscription records...");

            LocalDate today = LocalDate.now();

            MembershipPlan annualVip = membershipPlanRepository.findByPlanNameIgnoreCase("All-Access Annual VIP")
                    .orElse(null);
            MembershipPlan premiumQuarterly = membershipPlanRepository.findByPlanNameIgnoreCase("Premium Quarterly")
                    .orElse(null);
            MembershipPlan basicMonthly = membershipPlanRepository.findByPlanNameIgnoreCase("Basic Monthly")
                    .orElse(null);

            Long planIdVip = annualVip != null ? annualVip.getPlanId() : 3L;
            Long planIdQuarterly = premiumQuarterly != null ? premiumQuarterly.getPlanId() : 2L;
            Long planIdBasic = basicMonthly != null ? basicMonthly.getPlanId() : 1L;

            // Member 1 (Alex Mercer): Active VIP Annual
            Subscription s1 = new Subscription(
                    1L,
                    planIdVip,
                    today.minusMonths(2),
                    today.plusMonths(10),
                    "ACTIVE"
            );
            if (annualVip != null) s1.setPlan(annualVip);

            // Member 2 (Sarah Connor): Active Premium Quarterly
            Subscription s2 = new Subscription(
                    2L,
                    planIdQuarterly,
                    today.minusMonths(1),
                    today.plusMonths(2),
                    "ACTIVE"
            );
            if (premiumQuarterly != null) s2.setPlan(premiumQuarterly);

            // Member 3 (Marcus Vance): Expired Basic Monthly
            Subscription s3 = new Subscription(
                    3L,
                    planIdBasic,
                    today.minusMonths(3),
                    today.minusDays(5),
                    "EXPIRED"
            );
            if (basicMonthly != null) s3.setPlan(basicMonthly);

            subscriptionRepository.save(s1);
            subscriptionRepository.save(s2);
            subscriptionRepository.save(s3);

            log.info("Sample subscriptions seeded for Member 1 (Active VIP), Member 2 (Active Premium), Member 3 (Expired Basic)");
        }
    }
}
