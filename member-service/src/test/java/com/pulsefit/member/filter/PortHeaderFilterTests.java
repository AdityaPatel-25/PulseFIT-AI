package com.pulsefit.member.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PortHeaderFilterTests {

    private MockEnvironment environment;
    private PortHeaderFilter filter;

    @BeforeEach
    void setUp() {
        environment = new MockEnvironment();
        filter = new PortHeaderFilter(environment);
    }

    @Test
    void testHeaderUsesLocalServerPortWhenAvailable() throws ServletException, IOException {
        environment.setProperty("local.server.port", "8085");
        environment.setProperty("server.port", "8082");

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertEquals("8085", response.getHeader(PortHeaderFilter.PORT_HEADER),
                "Should prioritize local.server.port over server.port");
    }

    @Test
    void testHeaderFallsBackToServerPort() throws ServletException, IOException {
        environment.setProperty("server.port", "8082");

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertEquals("8082", response.getHeader(PortHeaderFilter.PORT_HEADER),
                "Should fall back to server.port when local.server.port is not present");
    }

    @Test
    void testHeaderFallsBackToRequestPortWhenEnvironmentMissing() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServerPort(8085);
        request.setLocalPort(8085);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertEquals("8085", response.getHeader(PortHeaderFilter.PORT_HEADER),
                "Should fall back to request local port if environment has no port configured");
    }

    @Test
    void testHeaderConfiguredForReplicaInstance() throws ServletException, IOException {
        environment.setProperty("server.port", "8085");

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertEquals("8085", response.getHeader(PortHeaderFilter.PORT_HEADER),
                "Replica instance on 8085 must inject port 8085");
    }
}
