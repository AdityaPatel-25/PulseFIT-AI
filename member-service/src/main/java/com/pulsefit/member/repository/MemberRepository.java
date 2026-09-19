package com.pulsefit.member.repository;

import com.pulsefit.member.model.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByContact(String contact);
    Optional<Member> findByEmail(String email);
    List<Member> findByStatus(String status);
}
