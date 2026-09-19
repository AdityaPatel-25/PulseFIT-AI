package com.pulsefit.member.config;

import com.pulsefit.member.model.Member;
import com.pulsefit.member.repository.MemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MemberDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(MemberDataInitializer.class);
    private final MemberRepository memberRepository;

    public MemberDataInitializer(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @Override
    public void run(String... args) {
        if (memberRepository.count() == 0) {
            log.info("Seeding initial PulseFit Member records...");

            Member m1 = new Member("Alex Mercer", "+1-555-0192", "alex@pulsefit.com", "742 Evergreen Terrace, Springfield", "+1-555-9988");
            Member m2 = new Member("Sarah Connor", "+1-555-0144", "sarah.connor@cyberdyne.org", "1204 Elm St, Los Angeles", "+1-555-4433");
            Member m3 = new Member("Marcus Vance", "+1-555-0177", "marcus.v@fitnesshub.io", "89 Ocean Avenue, Miami", "+1-555-7766");

            memberRepository.save(m1);
            memberRepository.save(m2);
            memberRepository.save(m3);

            log.info("Sample members seeded: Alex Mercer (ID 1), Sarah Connor (ID 2), Marcus Vance (ID 3)");
        }
    }
}
