package com.pulsefit.attendance.repository;

import com.pulsefit.attendance.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByMemberIdOrderByCheckInTimeDesc(Long memberId);

    List<Attendance> findTop20ByOrderByCheckInTimeDesc();

    List<Attendance> findByFacilityIdAndCheckInTimeBetweenOrderByCheckInTimeDesc(
            String facilityId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT a FROM Attendance a WHERE a.memberId = :memberId AND a.checkOutTime IS NULL AND a.accessStatus = 'GRANTED' ORDER BY a.checkInTime DESC")
    List<Attendance> findActiveCheckInsForMember(@Param("memberId") Long memberId);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.facilityId = :facilityId AND a.checkOutTime IS NULL AND a.accessStatus = 'GRANTED'")
    long countActiveOccupantsByFacility(@Param("facilityId") String facilityId);

    Optional<Attendance> findFirstByMemberIdAndAccessStatusOrderByCheckInTimeDesc(Long memberId, String accessStatus);

    List<Attendance> findTop50ByOrderByCheckInTimeDesc();
}
