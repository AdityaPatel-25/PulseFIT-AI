package com.pulsefit.subscription.repository;

import com.pulsefit.subscription.entity.MembershipPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipPlanRepository extends JpaRepository<MembershipPlan, Long> {

    Optional<MembershipPlan> findByPlanNameIgnoreCase(String planName);

    boolean existsByPlanNameIgnoreCase(String planName);

    boolean existsByPlanNameIgnoreCaseAndPlanIdNot(String planName, Long planId);

    List<MembershipPlan> findByActiveTrue();
}
