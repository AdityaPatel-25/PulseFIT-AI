package com.pulsefit.gateway;

import com.pulsefit.gateway.filter.JwtAuthenticationFilter;
import com.pulsefit.gateway.filter.JwtUtil;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false"
})
class ApiGatewayApplicationTests {

    private static final String SECRET = "PulseFitSuperSecretKeyForJWTHMACSHA256EnterpriseSecurity2024!";

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private RouteLocator routeLocator;

    private String generateValidToken(String username, String role) {
        Key key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .claim("email", username + "@pulsefit.com")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    @Test
    void testPlansRouteMatchesSubscriptionServiceAndHasJwtFilter() {
        List<Route> routes = routeLocator.getRoutes().collectList().block();
        assertNotNull(routes, "Gateway routes must be loaded");

        Route plansRoute = routes.stream()
                .filter(r -> "subscription-plans-service".equals(r.getId()))
                .findFirst()
                .orElse(null);

        assertNotNull(plansRoute, "Route 'subscription-plans-service' for /api/plans/** must be configured");
        assertEquals(URI.create("lb://SUBSCRIPTION-SERVICE"), plansRoute.getUri(),
                "Route destination must point to lb://SUBSCRIPTION-SERVICE");

        // Verify that JwtAuthenticationFilter is in the filter chain for this route
        boolean hasJwtFilter = plansRoute.getFilters().stream()
                .anyMatch(f -> f.toString().contains("JwtAuthenticationFilter") 
                        || f instanceof JwtAuthenticationFilter
                        || f.getClass().getName().contains("JwtAuthenticationFilter"));
        assertTrue(hasJwtFilter, "Route /api/plans/** must retain JwtAuthenticationFilter protection");
    }

    @Test
    void testPlansEndpointRejectsMissingToken() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/plans").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilter filter = jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config());
        filter.filter(exchange, ex -> Mono.empty()).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode(),
                "Requests to /api/plans without token must return 401 Unauthorized");
    }

    @Test
    void testPlansEndpointRejectsInvalidToken() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/plans")
                .header(HttpHeaders.AUTHORIZATION, "Bearer invalid.malformed.token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilter filter = jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config());
        filter.filter(exchange, ex -> Mono.empty()).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode(),
                "Requests to /api/plans with invalid token must return 401 Unauthorized");
    }

    @Test
    void testPlansEndpointAllowsValidTokenAndPropagatesHeaders() {
        String token = generateValidToken("member_alex", "ROLE_MEMBER");
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/plans")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicBoolean downstreamCalled = new AtomicBoolean(false);
        GatewayFilterChain downstreamChain = ex -> {
            downstreamCalled.set(true);
            assertEquals("member_alex", ex.getRequest().getHeaders().getFirst("X-User-Name"));
            assertEquals("ROLE_MEMBER", ex.getRequest().getHeaders().getFirst("X-User-Role"));
            return Mono.empty();
        };

        GatewayFilter filter = jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config());
        filter.filter(exchange, downstreamChain).block();

        assertTrue(downstreamCalled.get(), "Downstream service must be called when token is valid");
        assertNull(exchange.getResponse().getStatusCode(), "Response status must not be error for valid token");
    }

    @Test
    void testJwtValidationLogic() {
        assertFalse(jwtUtil.validateToken("invalid.jwt.token"));
        String validToken = generateValidToken("testuser", "ROLE_STAFF");
        assertTrue(jwtUtil.validateToken(validToken));
        assertEquals("testuser", jwtUtil.extractUsername(validToken));
        assertEquals("ROLE_STAFF", jwtUtil.extractRole(validToken));
    }

    @Test
    void testMemberRouteMatchesLoadBalancedServiceAndHasJwtFilter() {
        List<Route> routes = routeLocator.getRoutes().collectList().block();
        assertNotNull(routes, "Gateway routes must be loaded");

        Route memberRoute = routes.stream()
                .filter(r -> "member-service".equals(r.getId()))
                .findFirst()
                .orElse(null);

        assertNotNull(memberRoute, "Route 'member-service' for /api/members/** must be configured");
        assertEquals(URI.create("lb://MEMBER-SERVICE"), memberRoute.getUri(),
                "Route destination must point to lb://MEMBER-SERVICE for load balancing");

        boolean hasJwtFilter = memberRoute.getFilters().stream()
                .anyMatch(f -> f.toString().contains("JwtAuthenticationFilter")
                        || f instanceof JwtAuthenticationFilter
                        || f.getClass().getName().contains("JwtAuthenticationFilter"));
        assertTrue(hasJwtFilter, "Route /api/members/** must retain JwtAuthenticationFilter protection");
    }

    @Test
    void testMemberEndpointRejectsMissingToken() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/members").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilter filter = jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config());
        filter.filter(exchange, ex -> Mono.empty()).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode(),
                "Requests to /api/members without token must return 401 Unauthorized");
    }

    @Test
    void testMemberEndpointAllowsValidTokenAndPropagatesHeaders() {
        String token = generateValidToken("member_alex", "ROLE_MEMBER");
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/members")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicBoolean downstreamCalled = new AtomicBoolean(false);
        GatewayFilterChain downstreamChain = ex -> {
            downstreamCalled.set(true);
            assertEquals("member_alex", ex.getRequest().getHeaders().getFirst("X-User-Name"));
            assertEquals("ROLE_MEMBER", ex.getRequest().getHeaders().getFirst("X-User-Role"));
            return Mono.empty();
        };

        GatewayFilter filter = jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config());
        filter.filter(exchange, downstreamChain).block();

        assertTrue(downstreamCalled.get(), "Downstream service must be called when token is valid");
        assertNull(exchange.getResponse().getStatusCode(), "Response status must not be error for valid token");
    }

    @Test
    void testForgedClientIdentityHeadersAreOverriddenByVerifiedJwtClaims() {
        String token = generateValidToken("member_alex", "ROLE_MEMBER");
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/members")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .header("X-User-Name", "root_attacker")
                .header("X-User-Role", "ROLE_ADMIN")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicBoolean downstreamCalled = new AtomicBoolean(false);
        GatewayFilterChain downstreamChain = ex -> {
            downstreamCalled.set(true);
            // Verify forged headers were stripped and replaced with genuine verified JWT claims
            assertEquals("member_alex", ex.getRequest().getHeaders().getFirst("X-User-Name"),
                    "Forged X-User-Name must be stripped and replaced with verified JWT subject");
            assertEquals("ROLE_MEMBER", ex.getRequest().getHeaders().getFirst("X-User-Role"),
                    "Forged X-User-Role must be stripped and replaced with verified JWT role");
            assertEquals("Bearer " + token, ex.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION),
                    "Original Authorization Bearer token must be forwarded intact");
            return Mono.empty();
        };

        GatewayFilter filter = jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config());
        filter.filter(exchange, downstreamChain).block();

        assertTrue(downstreamCalled.get(), "Downstream service must be called when token is valid");
        assertNull(exchange.getResponse().getStatusCode(), "Response status must not be error for valid token");
    }
}
