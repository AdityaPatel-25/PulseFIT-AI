package com.pulsefit.subscription.repository;

import com.pulsefit.subscription.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByMemberId(Long memberId);

    @Query("SELECT s FROM Subscription s WHERE s.memberId = :memberId AND s.status = 'ACTIVE' AND s.expiryDate >= :currentDate ORDER BY s.expiryDate DESC")
    List<Subscription> findActiveSubscriptions(@Param("memberId") Long memberId, @Param("currentDate") LocalDate currentDate);

    Optional<Subscription> findFirstByMemberIdAndStatusOrderByExpiryDateDesc(Long memberId, String status);
}
