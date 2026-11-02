package com.pulsefit.member.service;

import com.pulsefit.member.dto.MemberRequest;
import com.pulsefit.member.dto.MemberResponse;
import com.pulsefit.member.exception.DuplicateResourceException;
import com.pulsefit.member.exception.ResourceNotFoundException;
import com.pulsefit.member.model.Member;
import com.pulsefit.member.repository.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class MemberService {

    private final MemberRepository memberRepository;

    public MemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public MemberResponse createMember(MemberRequest request) {
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            Optional<Member> existingByEmail = memberRepository.findByEmail(request.getEmail().trim());
            if (existingByEmail.isPresent()) {
                throw new DuplicateResourceException("Member with email already exists: " + request.getEmail().trim());
            }
        }

        if (request.getContact() != null && !request.getContact().isBlank()) {
            Optional<Member> existingByContact = memberRepository.findByContact(request.getContact().trim());
            if (existingByContact.isPresent()) {
                throw new DuplicateResourceException("Member with contact already exists: " + request.getContact().trim());
            }
        }

        Member member = new Member(
                request.getName().trim(),
                request.getContact().trim(),
                request.getEmail() != null ? request.getEmail().trim() : null,
                request.getAddress() != null ? request.getAddress().trim() : null,
                request.getEmergencyContact() != null ? request.getEmergencyContact().trim() : null
        );

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            member.setStatus(request.getStatus().trim().toUpperCase());
        }

        Member saved = memberRepository.save(member);
        return MemberResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public MemberResponse getMemberById(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with ID: " + memberId));
        return MemberResponse.fromEntity(member);
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> getAllMembers() {
        return memberRepository.findAll().stream()
                .map(MemberResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public MemberResponse updateMember(Long memberId, MemberRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with ID: " + memberId));

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String trimmedEmail = request.getEmail().trim();
            memberRepository.findByEmail(trimmedEmail)
                    .filter(existing -> !existing.getMemberId().equals(memberId))
                    .ifPresent(existing -> {
                        throw new DuplicateResourceException("Email is already used by another member: " + trimmedEmail);
                    });
            member.setEmail(trimmedEmail);
        } else {
            member.setEmail(null);
        }

        if (request.getContact() != null && !request.getContact().isBlank()) {
            String trimmedContact = request.getContact().trim();
            memberRepository.findByContact(trimmedContact)
                    .filter(existing -> !existing.getMemberId().equals(memberId))
                    .ifPresent(existing -> {
                        throw new DuplicateResourceException("Contact is already used by another member: " + trimmedContact);
                    });
            member.setContact(trimmedContact);
        }

        member.setName(request.getName().trim());
        member.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        member.setEmergencyContact(request.getEmergencyContact() != null ? request.getEmergencyContact().trim() : null);

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            member.setStatus(request.getStatus().trim().toUpperCase());
        }

        Member updated = memberRepository.save(member);
        return MemberResponse.fromEntity(updated);
    }

    public void deleteMember(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with ID: " + memberId));
        memberRepository.delete(member);
    }

    public void deactivateMember(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with ID: " + memberId));
        member.setStatus("INACTIVE");
        memberRepository.save(member);
    }

    @Transactional(readOnly = true)
    public boolean isMemberActive(Long memberId) {
        return memberRepository.findById(memberId)
                .map(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()))
                .orElse(false);
    }
}
