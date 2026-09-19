package com.pulsefit.attendance.service;

import com.pulsefit.attendance.client.MemberClient;
import com.pulsefit.attendance.client.SubscriptionClient;
import com.pulsefit.attendance.dto.CheckInRequest;
import com.pulsefit.attendance.dto.MemberDto;
import com.pulsefit.attendance.dto.SubscriptionDto;
import com.pulsefit.attendance.dto.TurnstileResult;
import com.pulsefit.attendance.model.Attendance;
import com.pulsefit.attendance.repository.AttendanceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class AttendanceServiceTests {

    private AttendanceRepository attendanceRepository;
    private MemberClient memberClient;
    private SubscriptionClient subscriptionClient;
    private AttendanceService attendanceService;

    @BeforeEach
    void setUp() {
        attendanceRepository = Mockito.mock(AttendanceRepository.class);
        memberClient = Mockito.mock(MemberClient.class);
        subscriptionClient = Mockito.mock(SubscriptionClient.class);
        attendanceService = new AttendanceService(attendanceRepository, memberClient, subscriptionClient);
    }

    @Test
    void testProcessCheckInGranted() {
        CheckInRequest request = new CheckInRequest(1L, "FACILITY_01", "PulseFit Central");

        MemberDto member = new MemberDto();
        member.setMemberId(1L);
        member.setName("Alex Mercer");
        member.setStatus("ACTIVE");
        when(memberClient.getMemberById(1L)).thenReturn(member);

        SubscriptionDto sub = new SubscriptionDto();
        sub.setSubscriptionId(10L);
        sub.setMemberId(1L);
        sub.setCurrentlyValid(true);
        sub.setExpiryDate(LocalDate.now().plusMonths(3));
        when(subscriptionClient.getActiveSubscription(1L)).thenReturn(sub);

        Attendance savedAttendance = new Attendance(1L, LocalDateTime.now(), "FACILITY_01", "PulseFit Central", "GRANTED", null);
        savedAttendance.setAttendanceId(500L);
        when(attendanceRepository.save(any(Attendance.class))).thenReturn(savedAttendance);

        TurnstileResult result = attendanceService.processCheckIn(request);
        assertNotNull(result);
        assertTrue(result.isGranted());
        assertEquals("Alex Mercer", result.getMemberName());
        assertEquals(500L, result.getAttendanceId());
    }

    @Test
    void testProcessCheckInDeniedExpiredSubscription() {
        CheckInRequest request = new CheckInRequest(3L, "FACILITY_01", "PulseFit Central");

        MemberDto member = new MemberDto();
        member.setMemberId(3L);
        member.setName("Marcus Vance");
        member.setStatus("ACTIVE");
        when(memberClient.getMemberById(3L)).thenReturn(member);

        // No active subscription returned
        when(subscriptionClient.getActiveSubscription(3L)).thenReturn(null);

        Attendance savedAttendance = new Attendance(3L, LocalDateTime.now(), "FACILITY_01", "PulseFit Central", "DENIED", "NO_ACTIVE_SUBSCRIPTION");
        when(attendanceRepository.save(any(Attendance.class))).thenReturn(savedAttendance);

        TurnstileResult result = attendanceService.processCheckIn(request);
        assertNotNull(result);
        assertFalse(result.isGranted());
        assertTrue(result.getMessage().contains("DENIED"));
    }

    @Test
    void testProcessCheckInDeniedInactiveMember() {
        CheckInRequest request = new CheckInRequest(9L, "FACILITY_01", "PulseFit Central");

        MemberDto member = new MemberDto();
        member.setMemberId(9L);
        member.setName("Banned User");
        member.setStatus("INACTIVE");
        when(memberClient.getMemberById(9L)).thenReturn(member);

        TurnstileResult result = attendanceService.processCheckIn(request);
        assertNotNull(result);
        assertFalse(result.isGranted());
        assertTrue(result.getMessage().contains("suspended or inactive"));
    }
}
