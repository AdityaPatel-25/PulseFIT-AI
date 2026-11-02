package com.pulsefit.member.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Diagnostic filter that attaches the responding server's HTTP port to every response.
 * Enables live load-balancing verification through API Gateway (X-Handled-By-Port).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PortHeaderFilter extends OncePerRequestFilter {

    public static final String PORT_HEADER = "X-Handled-By-Port";

    private final Environment environment;

    public PortHeaderFilter(Environment environment) {
        this.environment = environment;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String port = environment.getProperty("local.server.port");
        if (port == null || port.isBlank()) {
            port = environment.getProperty("server.port");
        }
        if (port == null || port.isBlank()) {
            port = String.valueOf(request.getLocalPort());
        }

        response.setHeader(PORT_HEADER, port);
        filterChain.doFilter(request, response);
    }
}
