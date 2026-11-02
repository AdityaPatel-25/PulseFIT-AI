package com.pulsefit.member.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pulsefit.member.dto.MemberRequest;
import com.pulsefit.member.exception.GlobalExceptionHandler;
import com.pulsefit.member.filter.PortHeaderFilter;
import com.pulsefit.member.model.Member;
import com.pulsefit.member.repository.MemberRepository;
import com.pulsefit.member.service.MemberService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MemberControllerTests {

    private MockMvc mockMvc;
    private MemberRepository memberRepository;
    private MemberService memberService;
    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        memberRepository = Mockito.mock(MemberRepository.class);
        memberService = new MemberService(memberRepository);
        MemberController controller = new MemberController(memberService);
        MockEnvironment env = new MockEnvironment();
        env.setProperty("server.port", "8082");
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(new PortHeaderFilter(env))
                .build();
    }

    @Test
    void testCreateMemberSuccessReturns201() throws Exception {
        MemberRequest request = new MemberRequest("Alice Walker", "+1-555-4321", "alice@pulsefit.com", "123 Gym Lane", "+1-555-9876");
        Member member = new Member("Alice Walker", "+1-555-4321", "alice@pulsefit.com", "123 Gym Lane", "+1-555-9876");
        member.setMemberId(10L);

        when(memberRepository.findByEmail("alice@pulsefit.com")).thenReturn(Optional.empty());
        when(memberRepository.findByContact("+1-555-4321")).thenReturn(Optional.empty());
        when(memberRepository.save(any(Member.class))).thenReturn(member);

        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.memberId").value(10L))
                .andExpect(jsonPath("$.name").value("Alice Walker"))
                .andExpect(jsonPath("$.contact").value("+1-555-4321"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void testCreateMemberValidationFailureReturns400() throws Exception {
        // Missing name and contact
        MemberRequest invalidRequest = new MemberRequest("", "", "invalid-email-format", "Address", "Emergency");

        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.contact").exists())
                .andExpect(jsonPath("$.errors.email").exists());
    }

    @Test
    void testGetMemberByIdSuccessReturns200() throws Exception {
        Member member = new Member("Alex Mercer", "+1-555-0192", "alex@pulsefit.com", "742 Evergreen", "+1-555-9988");
        member.setMemberId(1L);

        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));

        mockMvc.perform(get("/api/members/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberId").value(1L))
                .andExpect(jsonPath("$.name").value("Alex Mercer"));
    }

    @Test
    void testGetMemberByIdNotFoundReturns404() throws Exception {
        when(memberRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/members/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Member not found with ID: 999"));
    }

    @Test
    void testGetAllMembersReturns200() throws Exception {
        Member m1 = new Member("Alex", "+1-111", "alex@fit.com", "Addr", "Em");
        m1.setMemberId(1L);
        Member m2 = new Member("Sarah", "+1-222", "sarah@fit.com", "Addr", "Em");
        m2.setMemberId(2L);

        when(memberRepository.findAll()).thenReturn(List.of(m1, m2));

        mockMvc.perform(get("/api/members"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Alex"))
                .andExpect(jsonPath("$[1].name").value("Sarah"));
    }

    @Test
    void testUpdateMemberSuccessReturns200() throws Exception {
        Member existing = new Member("Old Name", "+1-111-222", "old@pulsefit.com", "Old Address", "Old Emergency");
        existing.setMemberId(1L);

        MemberRequest request = new MemberRequest("Alex Updated", "+1-555-0192", "alex.updated@pulsefit.com", "New Address", "+1-555-9988");

        when(memberRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(memberRepository.findByEmail("alex.updated@pulsefit.com")).thenReturn(Optional.empty());
        when(memberRepository.findByContact("+1-555-0192")).thenReturn(Optional.empty());
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/members/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alex Updated"))
                .andExpect(jsonPath("$.email").value("alex.updated@pulsefit.com"));
    }

    @Test
    void testDeleteMemberSuccessReturns200() throws Exception {
        Member member = new Member("To Delete", "+1-000", "delete@pulsefit.com", "Address", "Contact");
        member.setMemberId(1L);

        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));

        mockMvc.perform(delete("/api/members/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Member successfully deleted"))
                .andExpect(jsonPath("$.memberId").value(1L));

        verify(memberRepository, times(1)).delete(member);
    }

    @Test
    void testDeleteMemberNotFoundReturns404() throws Exception {
        when(memberRepository.findById(404L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/members/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Member not found with ID: 404"));
    }

    @Test
    void testGetAllMembersIncludesDiagnosticPortHeader() throws Exception {
        when(memberRepository.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/members"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Handled-By-Port", "8082"));
    }
}
