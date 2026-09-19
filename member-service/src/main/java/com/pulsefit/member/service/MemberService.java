package com.pulsefit.member.service;

import com.pulsefit.member.dto.MemberRequest;
import com.pulsefit.member.dto.MemberResponse;
import com.pulsefit.member.model.Member;
import com.pulsefit.member.repository.MemberRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MemberService {

    private final MemberRepository memberRepository;

    public MemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public MemberResponse createMember(MemberRequest request) {
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            Optional<Member> existingByEmail = memberRepository.findByEmail(request.getEmail());
            if (existingByEmail.isPresent()) {
                throw new IllegalArgumentException("Member with email already exists: " + request.getEmail());
            }
        }

        Member member = new Member(
                request.getName(),
                request.getContact(),
                request.getEmail(),
                request.getAddress(),
                request.getEmergencyContact()
        );

        Member saved = memberRepository.save(member);
        return MemberResponse.fromEntity(saved);
    }

    public MemberResponse getMemberById(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found with ID: " + memberId));
        return MemberResponse.fromEntity(member);
    }

    public List<MemberResponse> getAllMembers() {
        return memberRepository.findAll().stream()
                .map(MemberResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public MemberResponse updateMember(Long memberId, MemberRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found with ID: " + memberId));

        member.setName(request.getName());
        member.setContact(request.getContact());
        member.setEmail(request.getEmail());
        member.setAddress(request.getAddress());
        member.setEmergencyContact(request.getEmergencyContact());

        Member updated = memberRepository.save(member);
        return MemberResponse.fromEntity(updated);
    }

    public void deactivateMember(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found with ID: " + memberId));
        member.setStatus("INACTIVE");
        memberRepository.save(member);
    }

    public boolean isMemberActive(Long memberId) {
        return memberRepository.findById(memberId)
                .map(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()))
                .orElse(false);
    }
}
