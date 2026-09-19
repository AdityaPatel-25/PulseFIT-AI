package com.pulsefit.attendance.config;

import com.pulsefit.attendance.model.Attendance;
import com.pulsefit.attendance.repository.AttendanceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class AttendanceDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AttendanceDataInitializer.class);
    private final AttendanceRepository attendanceRepository;

    public AttendanceDataInitializer(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    @Override
    public void run(String... args) {
        if (attendanceRepository.count() == 0) {
            log.info("Seeding initial PulseFit Attendance turnstile logs...");

            LocalDateTime now = LocalDateTime.now();

            Attendance a1 = new Attendance(1L, now.minusHours(3), "FACILITY_DOWNTOWN", "PulseFit Downtown Elite", "GRANTED", null);
            a1.setCheckOutTime(now.minusHours(1).minusMinutes(30));

            Attendance a2 = new Attendance(2L, now.minusHours(1), "FACILITY_UPTOWN", "PulseFit Uptown Olympic", "GRANTED", null);

            Attendance a3 = new Attendance(3L, now.minusMinutes(45), "FACILITY_WESTSIDE", "PulseFit Westside Express", "DENIED", "NO_ACTIVE_SUBSCRIPTION");

            attendanceRepository.save(a1);
            attendanceRepository.save(a2);
            attendanceRepository.save(a3);

            log.info("Sample attendance records seeded: Downtown checkin/out, Uptown active, Westside denied");
        }
    }
}
