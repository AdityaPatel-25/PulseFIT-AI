package com.pulsefit.subscription.config;

import com.pulsefit.subscription.model.Subscription;
import com.pulsefit.subscription.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;

@Configuration
public class SubscriptionDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionDataInitializer.class);
    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionDataInitializer(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @Override
    public void run(String... args) {
        if (subscriptionRepository.count() == 0) {
            log.info("Seeding initial PulseFit Subscription records...");

            LocalDate today = LocalDate.now();

            // Active Multi-Facility VIP for Member 1 (Alex Mercer)
            Subscription s1 = new Subscription(
                    1L,
                    "ALL_ACCESS_ANNUAL",
                    today.minusMonths(2),
                    today.plusMonths(10),
                    "MULTI_FACILITY",
                    599.99,
                    true
            );

            // Active Premium Quarterly for Member 2 (Sarah Connor)
            Subscription s2 = new Subscription(
                    2L,
                    "PREMIUM_QUARTERLY",
                    today.minusMonths(1),
                    today.plusMonths(2),
                    "MULTI_FACILITY",
                    149.99,
                    false
            );

            // Expired Monthly Plan for Member 3 (Marcus Vance)
            Subscription s3 = new Subscription(
                    3L,
                    "BASIC_MONTHLY",
                    today.minusMonths(3),
                    today.minusDays(5),
                    "SINGLE_FACILITY",
                    49.99,
                    false
            );
            s3.setStatus("EXPIRED");

            subscriptionRepository.save(s1);
            subscriptionRepository.save(s2);
            subscriptionRepository.save(s3);

            log.info("Sample subscriptions seeded: Member 1 (Active VIP), Member 2 (Active Premium), Member 3 (Expired Basic)");
        }
    }
}
