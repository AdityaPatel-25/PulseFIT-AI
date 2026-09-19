package com.pulsefit.member.service;

import com.pulsefit.member.dto.MemberRequest;
import com.pulsefit.member.dto.MemberResponse;
import com.pulsefit.member.model.Member;
import com.pulsefit.member.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class MemberServiceTests {

    private MemberRepository memberRepository;
    private MemberService memberService;

    @BeforeEach
    void setUp() {
        memberRepository = Mockito.mock(MemberRepository.class);
        memberService = new MemberService(memberRepository);
    }

    @Test
    void testCreateMemberSuccess() {
        MemberRequest request = new MemberRequest("John Doe", "+1-234-567", "john@pulsefit.com", "123 Main St", "+1-999-888");
        Member member = new Member("John Doe", "+1-234-567", "john@pulsefit.com", "123 Main St", "+1-999-888");
        member.setMemberId(10L);

        when(memberRepository.findByEmail("john@pulsefit.com")).thenReturn(Optional.empty());
        when(memberRepository.save(any(Member.class))).thenReturn(member);

        MemberResponse response = memberService.createMember(request);
        assertNotNull(response);
        assertEquals(10L, response.getMemberId());
        assertEquals("John Doe", response.getName());
        assertEquals("+1-234-567", response.getContact());
    }

    @Test
    void testGetMemberById() {
        Member member = new Member("Jane Smith", "+1-987-654", "jane@pulsefit.com", "456 Oak St", "+1-111-222");
        member.setMemberId(5L);

        when(memberRepository.findById(5L)).thenReturn(Optional.of(member));

        MemberResponse response = memberService.getMemberById(5L);
        assertNotNull(response);
        assertEquals(5L, response.getMemberId());
        assertEquals("Jane Smith", response.getName());
    }

    @Test
    void testIsMemberActive() {
        Member activeMember = new Member("Active Guy", "+1-111", "guy@fit.com", "Address", "Contact");
        activeMember.setStatus("ACTIVE");
        Member inactiveMember = new Member("Inactive Guy", "+1-222", "guy2@fit.com", "Address", "Contact");
        inactiveMember.setStatus("INACTIVE");

        when(memberRepository.findById(1L)).thenReturn(Optional.of(activeMember));
        when(memberRepository.findById(2L)).thenReturn(Optional.of(inactiveMember));

        assertTrue(memberService.isMemberActive(1L));
        assertFalse(memberService.isMemberActive(2L));
    }
}
