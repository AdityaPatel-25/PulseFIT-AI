package com.pulsefit.auth.config;

import com.pulsefit.auth.model.User;
import com.pulsefit.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            log.info("Seeding default PulseFit users into Auth Service...");

            User admin = new User("admin", passwordEncoder.encode("admin123"), "admin@pulsefit.com", "ROLE_ADMIN");
            User staff = new User("staff_john", passwordEncoder.encode("staff123"), "staff@pulsefit.com", "ROLE_STAFF");
            User member = new User("member_alex", passwordEncoder.encode("member123"), "alex@pulsefit.com", "ROLE_MEMBER");

            userRepository.save(admin);
            userRepository.save(staff);
            userRepository.save(member);

            log.info("PulseFit default users initialized successfully: admin, staff_john, member_alex");
        }
    }
}
