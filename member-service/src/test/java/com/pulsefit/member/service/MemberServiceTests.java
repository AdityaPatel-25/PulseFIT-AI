package com.pulsefit.member.service;

import com.pulsefit.member.dto.MemberRequest;
import com.pulsefit.member.dto.MemberResponse;
import com.pulsefit.member.exception.DuplicateResourceException;
import com.pulsefit.member.exception.ResourceNotFoundException;
import com.pulsefit.member.model.Member;
import com.pulsefit.member.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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
        when(memberRepository.findByContact("+1-234-567")).thenReturn(Optional.empty());
        when(memberRepository.save(any(Member.class))).thenReturn(member);

        MemberResponse response = memberService.createMember(request);
        assertNotNull(response);
        assertEquals(10L, response.getMemberId());
        assertEquals("John Doe", response.getName());
        assertEquals("+1-234-567", response.getContact());
    }

    @Test
    void testCreateMemberDuplicateEmailThrowsException() {
        MemberRequest request = new MemberRequest("John Doe", "+1-234-567", "john@pulsefit.com", "123 Main St", "+1-999-888");
        Member existing = new Member("Existing User", "+1-999-000", "john@pulsefit.com", "Address", "Contact");
        existing.setMemberId(1L);

        when(memberRepository.findByEmail("john@pulsefit.com")).thenReturn(Optional.of(existing));

        assertThrows(DuplicateResourceException.class, () -> memberService.createMember(request));
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    void testCreateMemberDuplicateContactThrowsException() {
        MemberRequest request = new MemberRequest("John Doe", "+1-234-567", "unique@pulsefit.com", "123 Main St", "+1-999-888");
        Member existing = new Member("Existing User", "+1-234-567", "other@pulsefit.com", "Address", "Contact");
        existing.setMemberId(2L);

        when(memberRepository.findByEmail("unique@pulsefit.com")).thenReturn(Optional.empty());
        when(memberRepository.findByContact("+1-234-567")).thenReturn(Optional.of(existing));

        assertThrows(DuplicateResourceException.class, () -> memberService.createMember(request));
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    void testGetMemberByIdSuccess() {
        Member member = new Member("Jane Smith", "+1-987-654", "jane@pulsefit.com", "456 Oak St", "+1-111-222");
        member.setMemberId(5L);

        when(memberRepository.findById(5L)).thenReturn(Optional.of(member));

        MemberResponse response = memberService.getMemberById(5L);
        assertNotNull(response);
        assertEquals(5L, response.getMemberId());
        assertEquals("Jane Smith", response.getName());
    }

    @Test
    void testGetMemberByIdNotFoundThrowsException() {
        when(memberRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> memberService.getMemberById(999L));
    }

    @Test
    void testGetAllMembers() {
        Member m1 = new Member("Member 1", "+1-111", "m1@fit.com", "Addr 1", "Em 1");
        m1.setMemberId(1L);
        Member m2 = new Member("Member 2", "+1-222", "m2@fit.com", "Addr 2", "Em 2");
        m2.setMemberId(2L);

        when(memberRepository.findAll()).thenReturn(List.of(m1, m2));

        List<MemberResponse> all = memberService.getAllMembers();
        assertEquals(2, all.size());
        assertEquals("Member 1", all.get(0).getName());
        assertEquals("Member 2", all.get(1).getName());
    }

    @Test
    void testUpdateMemberSuccess() {
        Member existing = new Member("Old Name", "+1-111-222", "old@pulsefit.com", "Old Address", "Old Emergency");
        existing.setMemberId(1L);

        MemberRequest updateRequest = new MemberRequest("New Name", "+1-333-444", "new@pulsefit.com", "New Address", "New Emergency");

        when(memberRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(memberRepository.findByEmail("new@pulsefit.com")).thenReturn(Optional.empty());
        when(memberRepository.findByContact("+1-333-444")).thenReturn(Optional.empty());
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MemberResponse updated = memberService.updateMember(1L, updateRequest);
        assertNotNull(updated);
        assertEquals("New Name", updated.getName());
        assertEquals("+1-333-444", updated.getContact());
        assertEquals("new@pulsefit.com", updated.getEmail());
    }

    @Test
    void testUpdateMemberNotFoundThrowsException() {
        MemberRequest updateRequest = new MemberRequest("New Name", "+1-333-444", "new@pulsefit.com", "New Address", "New Emergency");
        when(memberRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> memberService.updateMember(404L, updateRequest));
    }

    @Test
    void testDeleteMemberSuccess() {
        Member existing = new Member("To Delete", "+1-000", "delete@pulsefit.com", "Address", "Contact");
        existing.setMemberId(7L);

        when(memberRepository.findById(7L)).thenReturn(Optional.of(existing));

        memberService.deleteMember(7L);
        verify(memberRepository, times(1)).delete(existing);
    }

    @Test
    void testDeleteMemberNotFoundThrowsException() {
        when(memberRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> memberService.deleteMember(999L));
        verify(memberRepository, never()).delete(any(Member.class));
    }

    @Test
    void testDeactivateMemberSuccess() {
        Member existing = new Member("Active Guy", "+1-111", "guy@fit.com", "Address", "Contact");
        existing.setMemberId(3L);
        existing.setStatus("ACTIVE");

        when(memberRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> invocation.getArgument(0));

        memberService.deactivateMember(3L);
        assertEquals("INACTIVE", existing.getStatus());
        verify(memberRepository, times(1)).save(existing);
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
