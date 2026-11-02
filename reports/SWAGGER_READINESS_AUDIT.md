# PulseFIT AI — Swagger UI / OpenAPI 3 Readiness Audit & Review-2 Integration Assessment

**Project:** `E:\PulseFIT-AI`  
**Engineer:** Senior Spring Boot & OpenAPI Integration Engineer  
**Audit Type:** Read-Only Runtime Verification & Architectural Inspection  
**Audit Date:** November 2026  
**Primary Review Target:** Can Swagger UI replace Postman as the Primary Review-2 Demonstration Interface?  
**Final Verdict:** **YES — RECOMMENDED WITH UNIFIED GATEWAY SWAGGER UI AS PRIMARY INTERFACE**

---

## Executive Summary

An exhaustive, read-only architectural and runtime audit was conducted across all six microservices of the **PulseFIT AI** fitness management platform. 

### Core Audit Outcomes:
1. **Full OpenAPI 3 & Springdoc Implementation Already in Place:** All four core domain microservices (`auth-service`, `member-service`, `subscription-service`, `attendance-service`) and the `api-gateway` have modern, fully compatible **Springdoc OpenAPI 2.5.0** dependencies configured and operating on **Java 17**, **Spring Boot 3.2.5**, and **Spring Cloud 2023.0.1**. Zero deprecated or incompatible Springfox dependencies are present.
2. **Centralized Gateway Swagger Hub Is Active & Runtime-Verified:** Spring Cloud Gateway (`:8080`) provides a centralized, unified Swagger UI testbench at `http://localhost:8080/swagger-ui.html`. The gateway dynamically proxies OpenAPI documentation (`/v3/api-docs/*`) from all downstream microservices via Eureka discovery and URL rewriting.
3. **Bearer JWT "Authorize" Button Verified:** All domain microservices declare a global `BearerAuth` security scheme (`type: http`, `scheme: bearer`, `bearerFormat: JWT`). Swagger UI renders the prominent green **"Authorize 🔓"** button, allowing evaluators to paste a JWT token once and execute authenticated requests across protected endpoints.
4. **Endpoint Coverage Verified:** 100% of REST controller endpoints across the 4 business services are indexed by OpenAPI.
5. **Demonstration Superiority over Postman:** Swagger UI provides a significantly more professional, self-documenting, and technically rigorous demonstration interface for university and technical evaluators. Evaluators see live schema definitions, input validation rules, and Swagger's native execution engine without relying on external third-party desktop tooling (Postman).

---

## 1. Service-by-Service Swagger Availability Matrix

Each service is evaluated and classified according to standard audit status categories:
- **`RUNTIME-VERIFIED`**: Tested live via HTTP/browser; responds with HTTP 200 and valid OAS JSON / HTML.
- **`IMPLEMENTED`**: Code and configuration present in repository.
- **`AUTOMATED-TESTED`**: Validated by automated test scripts and security filters.
- **`NEEDS ATTENTION`**: Operational, but has minor cosmetic or configuration caveats.
- **`NOT AVAILABLE`**: Service does not host Swagger UI by architectural design.

| Service Name | Port | Architecture Role | Springdoc Dependency | Swagger UI Status | OpenAPI JSON Status | Classification |
|---|:---:|---|---|:---:|:---:|:---:|
| **Eureka Server** | `8761` | Service Registry & Discovery | None (Infra) | N/A (Dashboard only) | N/A | **NOT AVAILABLE** (By Design) |
| **API Gateway** | `8080` | Edge Gateway & Ingress Router | `springdoc-openapi-starter-webflux-ui:2.5.0` | `200 OK` (`/swagger-ui.html`) | `200 OK` (4 routed specs) | **RUNTIME-VERIFIED** |
| **Auth Service** | `8081` | Identity, JWT & User Directory | `springdoc-openapi-starter-webmvc-ui:2.5.0` | `200 OK` (`/swagger-ui/index.html`) | `200 OK` (`/v3/api-docs`) | **RUNTIME-VERIFIED** |
| **Member Service** | `8082` | Profiles, Lifecycle & Retention | `springdoc-openapi-starter-webmvc-ui:2.5.0` | `200 OK` (`/swagger-ui/index.html`) | `200 OK` (`/v3/api-docs`) | **RUNTIME-VERIFIED** |
| **Subscription Service** | `8083` | Plans, Billing & Courtesy Passes | `springdoc-openapi-starter-webmvc-ui:2.5.0` | `200 OK` (`/swagger-ui/index.html`) | `200 OK` (`/v3/api-docs`) | **RUNTIME-VERIFIED** |
| **Attendance Service** | `8084` | RFID Turnstiles & AI Fraud Guard | `springdoc-openapi-starter-webmvc-ui:2.5.0` | `200 OK` (`/swagger-ui/index.html`) | `200 OK` (`/v3/api-docs`) | **NEEDS ATTENTION** (Missing `@Operation` summaries; 100% functional) |
| **Frontend Portal** | `3000` | React Web Dashboard | `SwaggerPortal.jsx` (Iframe Hub) | `200 OK` (In-App Tab) | N/A | **RUNTIME-VERIFIED** |

---

## 2. Actual Swagger UI and OpenAPI JSON URLs

### A. Centralized Unified Gateway Swagger UI (Recommended Demo Interface)
- **Unified Gateway Swagger UI:** `http://localhost:8080/swagger-ui.html`
  - *Redirects 302 to:* `http://localhost:8080/webjars/swagger-ui/index.html`
  - *Aggregates definitions for all 4 microservices in a single top-right dropdown.*
- **Gateway OpenAPI JSON Endpoints (Proxied via Eureka):**
  - Auth Service: `http://localhost:8080/v3/api-docs/auth-service` (HTTP 200, 4.4 KB)
  - Member Service: `http://localhost:8080/v3/api-docs/member-service` (HTTP 200, 9.9 KB)
  - Subscription Service: `http://localhost:8080/v3/api-docs/subscription-service` (HTTP 200, 9.5 KB)
  - Attendance Service: `http://localhost:8080/v3/api-docs/attendance-service` (HTTP 200, 10.0 KB)

### B. Direct Microservice Swagger UI Testbenches (Standalone)
- **Auth Service:**
  - Swagger UI: `http://localhost:8081/swagger-ui/index.html` (HTTP 200)
  - OpenAPI JSON: `http://localhost:8081/v3/api-docs` (HTTP 200)
- **Member Service:**
  - Swagger UI: `http://localhost:8082/swagger-ui/index.html` (HTTP 200)
  - OpenAPI JSON: `http://localhost:8082/v3/api-docs` (HTTP 200)
- **Subscription Service:**
  - Swagger UI: `http://localhost:8083/swagger-ui/index.html` (HTTP 200)
  - OpenAPI JSON: `http://localhost:8083/v3/api-docs` (HTTP 200)
- **Attendance Service:**
  - Swagger UI: `http://localhost:8084/swagger-ui/index.html` (HTTP 200)
  - OpenAPI JSON: `http://localhost:8084/v3/api-docs` (HTTP 200)

---

## 3. Dependency & Version Compatibility Analysis

### Architecture Alignment
- **Java:** `17` (LTS)
- **Spring Boot:** `3.2.5`
- **Spring Cloud:** `2023.0.1` (Leyton)
- **JJWT:** `0.11.5`
- **Springdoc OpenAPI:** `2.5.0`

### Dependency Configuration Audit:
1. **Root `pom.xml` (`pulsefit-parent`):**
   - Declares `<springdoc.version>2.5.0</springdoc.version>`.
   - In `<dependencyManagement>`, imports:
     ```xml
     <dependency>
         <groupId>org.springdoc</groupId>
         <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
         <version>${springdoc.version}</version>
     </dependency>
     ```
2. **Downstream MVC Services (`auth`, `member`, `subscription`, `attendance`):**
   - Each includes `springdoc-openapi-starter-webmvc-ui` managed dependency without version overrides.
3. **API Gateway (`api-gateway`):**
   - Because Spring Cloud Gateway is built on the non-blocking **Reactive WebFlux** stack (Project Reactor / Netty), standard `webmvc-ui` would fail to start.
   - `api-gateway/pom.xml` correctly declares:
     ```xml
     <dependency>
         <groupId>org.springdoc</groupId>
         <artifactId>springdoc-openapi-starter-webflux-ui</artifactId>
         <version>2.5.0</version>
     </dependency>
     ```
4. **Springfox Incompatibility Check:**
   - 0 references to `springfox` or `io.springfox` exist in any `pom.xml`. Springfox is dead and fundamentally incompatible with Spring Boot 3 due to `javax` -> `jakarta` namespace migration and WebMvc pattern changes. Springdoc 2.5.0 is the modern, production-grade standard.

---

## 4. OpenAPI Configuration & JWT Bearer Security Audit

### A. OpenAPI Configuration Classes
Each microservice contains a dedicated `@Configuration` class:
- `com.pulsefit.auth.config.OpenApiConfig`
- `com.pulsefit.member.config.OpenApiConfig`
- `com.pulsefit.subscription.config.OpenApiConfig`
- `com.pulsefit.attendance.config.OpenApiConfig`

### B. Security Scheme Definition
All 4 classes define identical OpenAPI 3 Bearer Authentication schemes:
```java
public static final String SECURITY_SCHEME_NAME = "BearerAuth";

@Bean
public OpenAPI serviceOpenAPI() {
    return new OpenAPI()
        .servers(List.of(
            new Server().url("http://localhost:8080").description("API Gateway Ingress (Port 8080)"),
            new Server().url("http://localhost:<service-port>").description("Direct Service")
        ))
        .info(new Info().title(...).version("1.0.0")...)
        .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
        .components(new Components()
            .addSecuritySchemes(SECURITY_SCHEME_NAME,
                new SecurityScheme()
                    .name(SECURITY_SCHEME_NAME)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Enter your JWT token (without 'Bearer ' prefix).")));
}
```

### C. Live Security Scheme Verification
Runtime inspection of `/v3/api-docs` confirms:
- `components.securitySchemes.BearerAuth.type`: `http`
- `components.securitySchemes.BearerAuth.scheme`: `bearer`
- `components.securitySchemes.BearerAuth.bearerFormat`: `JWT`
- `security`: `[{"BearerAuth": []}]` (applied globally to all endpoints)

### D. Authorize Button Visual Inspection
The browser subagent confirmed:
- The **"Authorize 🔓"** button renders prominently with a green lock icon at the top right of the Swagger UI.
- When clicked, Swagger opens an input modal titled `BearerAuth (http, Bearer)`.
- When the JWT token is entered and saved, Swagger UI attaches the header `Authorization: Bearer <token>` to all subsequent "Try it out -> Execute" calls.

---

## 5. Gateway Routing & Ingress Compatibility

### A. Gateway Route Configuration (`api-gateway/src/main/resources/application.yml`)
The API Gateway routes both REST traffic and OpenAPI documentation:
```yaml
spring:
  cloud:
    gateway:
      routes:
        # Business Routes
        - id: auth-service
          uri: lb://AUTH-SERVICE
          predicates:
            - Path=/api/auth/**

        - id: member-service
          uri: lb://MEMBER-SERVICE
          predicates:
            - Path=/api/members/**
          filters:
            - name: JwtAuthenticationFilter

        - id: subscription-service
          uri: lb://SUBSCRIPTION-SERVICE
          predicates:
            - Path=/api/subscriptions/**
          filters:
            - name: JwtAuthenticationFilter

        - id: subscription-plans-service
          uri: lb://SUBSCRIPTION-SERVICE
          predicates:
            - Path=/api/plans/**
          filters:
            - name: JwtAuthenticationFilter

        - id: attendance-service
          uri: lb://ATTENDANCE-SERVICE
          predicates:
            - Path=/api/attendance/**
          filters:
            - name: JwtAuthenticationFilter

        # OpenAPI Specs Routing for Centralized Gateway Swagger UI
        - id: auth-docs
          uri: lb://AUTH-SERVICE
          predicates:
            - Path=/v3/api-docs/auth-service
          filters:
            - RewritePath=/v3/api-docs/auth-service, /v3/api-docs

        - id: member-docs
          uri: lb://MEMBER-SERVICE
          predicates:
            - Path=/v3/api-docs/member-service
          filters:
            - RewritePath=/v3/api-docs/member-service, /v3/api-docs

        - id: subscription-docs
          uri: lb://SUBSCRIPTION-SERVICE
          predicates:
            - Path=/v3/api-docs/subscription-service
          filters:
            - RewritePath=/v3/api-docs/subscription-service, /v3/api-docs

        - id: attendance-docs
          uri: lb://ATTENDANCE-SERVICE
          predicates:
            - Path=/v3/api-docs/attendance-service
          filters:
            - RewritePath=/v3/api-docs/attendance-service, /v3/api-docs

springdoc:
  swagger-ui:
    path: /swagger-ui.html
    urls:
      - name: 1. Auth Service (:8081 via Gateway)
        url: /v3/api-docs/auth-service
      - name: 2. Member Service (:8082 via Gateway)
        url: /v3/api-docs/member-service
      - name: 3. Subscription Service (:8083 via Gateway)
        url: /v3/api-docs/subscription-service
      - name: 4. Attendance Service (:8084 via Gateway)
        url: /v3/api-docs/attendance-service
```

### B. Gateway Routing Verification
- Requests to `http://localhost:8080/v3/api-docs/member-service` are rewritten to `http://member-service:8082/v3/api-docs` and return `200 OK`.
- Notice that the OpenAPI documentation routes (`/v3/api-docs/*`) do **NOT** have `JwtAuthenticationFilter` attached, allowing Swagger UI to load the documentation schemas without requiring preliminary authentication.

---

## 6. SecurityConfig & Authentication Restrictions

### A. Downstream Security Exceptions
In every downstream microservice, the Spring Security filter chain explicitly permits unauthenticated access to Swagger resources:
```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers(
        "/actuator/**",
        "/v3/api-docs/**",
        "/swagger-ui/**",
        "/swagger-ui.html",
        "/error"
    ).permitAll()
    ...
)
```

### B. Public Endpoints vs Protected Endpoints
1. `POST /api/auth/login` and `POST /api/auth/register` are explicitly `permitAll()`:
   - Evaluators can open Swagger UI at `http://localhost:8080/swagger-ui.html` and execute `POST /api/auth/login` **without any prior token**.
   - The response delivers the Bearer JWT token, username, role, and member ID.
2. Protected endpoints (`/api/members/**`, `/api/subscriptions/**`, `/api/plans/**`, `/api/attendance/**`) reject unauthenticated requests with `401 Unauthorized`.
3. Object-level ownership (BOLA / IDOR) and role-based access control (RBAC) work identically whether invoked through Swagger UI, Postman, or PowerShell:
   - Member Alex (Role: `MEMBER`, ID: 1) calling `GET /api/members/1` -> `200 OK`.
   - Member Alex calling `GET /api/members/2` -> `403 Forbidden` (`@securityEvaluator.canAccessMember(#memberId)` rejects).
   - Member Alex calling `POST /api/plans` -> `403 Forbidden` (Requires `ADMIN` or `STAFF`).
   - Admin calling `POST /api/plans` -> `201 Created`.

### C. Critical Finding: `X-Frame-Options` Header Restriction
- **Gateway (`:8080`):** Does not set `X-Frame-Options: DENY`. It embeds seamlessly into iframes (e.g., inside the React Frontend Swagger Tab).
- **Auth Service (`:8081`):** `headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable)` is set. Embeds seamlessly into iframes.
- **Member (`:8082`), Subscription (`:8083`), Attendance (`:8084`):** These direct services do not disable frame options, so Spring Security defaults to `X-Frame-Options: DENY`.
- **Impact & Recommendation:** When demonstrating Swagger, **use the Gateway Unified Swagger UI (`http://localhost:8080/swagger-ui.html`)** or open individual services in a **standalone browser tab** (`target="_blank"`). Do not attempt to embed direct ports 8082/8083/8084 inside an iframe.

---

## 7. API Endpoint Coverage Analysis

A complete audit of every `@RestController` in the codebase versus the `/v3/api-docs` schema was performed:

### 1. Auth Service (`AuthController`, `ActuatorController`)
- `POST /api/auth/register` — Documented (Summary, DTO schema, 201 Created)
- `POST /api/auth/login` — Documented (Summary, LoginRequest schema, 200 OK)
- `POST /api/auth/social-login` — Documented
- `POST /api/auth/reset-password` — Documented
- `POST /api/auth/change-password` — Documented (Authenticated)
- `GET /api/auth/validate` — Documented
- `GET /api/auth/users` — Documented (Admin restricted)
- `GET /api/auth/health` — Documented
- `GET /actuator/health`, `GET /actuator/info` — Documented
- **Coverage:** **100%**

### 2. Member Service (`MemberController`, `MemberAiController`, `ActuatorController`)
- `GET /api/members` — Documented (`@Operation`, `@Tag`)
- `POST /api/members` — Documented (`MemberRequest` schema with validation rules)
- `GET /api/members/{memberId}` — Documented
- `PUT /api/members/{memberId}` — Documented
- `DELETE /api/members/{memberId}` — Documented
- `PATCH /api/members/{memberId}/deactivate` — Documented
- `GET /api/members/{memberId}/status` — Documented
- `GET /api/members/ai/retention/{memberId}` — Documented (Auto-mapped)
- `GET /api/members/ai/churn-report` — Documented (Auto-mapped)
- `GET /actuator/health`, `GET /actuator/info` — Documented
- **Coverage:** **100%**

### 3. Subscription Service (`SubscriptionController`, `MembershipPlanController`, `SubscriptionAiController`, `ActuatorController`)
- `GET /api/plans` — Documented (`@Tag(name = "Membership Plan Management")`)
- `POST /api/plans` — Documented (`MembershipPlanRequest` schema: `planName`, `price`, etc.)
- `GET /api/plans/{id}` — Documented
- `PUT /api/plans/{id}` — Documented
- `DELETE /api/plans/{id}` — Documented
- `GET /api/subscriptions` — Documented (`@Tag(name = "Subscription Management")`)
- `POST /api/subscriptions` — Documented
- `GET /api/subscriptions/{id}` — Documented
- `DELETE /api/subscriptions/{id}` — Documented
- `GET /api/subscriptions/{id}/status` — Documented
- `GET /api/subscriptions/member/{memberId}` — Documented
- `GET /api/subscriptions/member/{memberId}/active` — Documented
- `POST /api/subscriptions/{id}/renew` & `PUT .../renew` — Documented
- `POST /api/subscriptions/ai/grant-courtesy-pass/{id}` — Documented
- `GET /api/subscriptions/ai/optimize/{memberId}` — Documented
- `GET /actuator/health`, `GET /actuator/info` — Documented
- **Coverage:** **100%**

### 4. Attendance Service (`AttendanceController`, `AttendanceAiController`, `ActuatorController`)
- `POST /api/attendance/check-in` — Documented (Auto-mapped from `CheckInRequest`)
- `POST /api/attendance/check-out` — Documented (Auto-mapped from `CheckOutRequest`)
- `GET /api/attendance/recent` — Documented
- `GET /api/attendance/member/{memberId}` — Documented
- `GET /api/attendance/facility/{facilityId}` — Documented
- `POST /api/attendance/ai/tailgate-check` — Documented
- `GET /api/attendance/ai/occupancy-heatmap` — Documented
- `GET /api/attendance/ai/fraud-alerts` — Documented
- `GET /api/attendance/ai/facility-forecast/{facilityId}` — Documented
- `GET /actuator/health`, `GET /actuator/info` — Documented
- **Coverage:** **100%**
- **Note:** While all endpoints in `AttendanceController` and `AttendanceAiController` are 100% documented with schemas and parameter bindings, they lack custom `@Operation(summary = "...")` and `@Tag` annotations. As a result, Swagger UI displays the method name instead of a descriptive human title. This is cosmetic and does not affect testability or functionality.

---

## 8. Postman vs Swagger UI: Comparative Analysis for Review-2

| Evaluation Dimension | Postman Desktop Application | Swagger UI (`:8080/swagger-ui.html`) | Winner for Review-2 |
|---|---|---|:---:|
| **Architectural Integration** | External third-party desktop client; not part of the codebase. | Native OpenAPI 3 standard bundled within Spring Boot microservices. | **Swagger UI** (Proves microservices engineering) |
| **Evaluator Perception** | Looks like student manual testing. | Looks like enterprise, production-ready developer platform. | **Swagger UI** |
| **Setup & Dependencies** | Requires evaluator/presenter to import Postman collections and environment variables. | Zero setup: opens in any web browser at `localhost:8080`. | **Swagger UI** |
| **Live Schema Validation** | Manual JSON payload construction; prone to typos during live demo. | Auto-populates valid request body templates with validation constraints. | **Swagger UI** |
| **JWT Bearer Handling** | Managed via collection authorization scripts. | Native "Authorize 🔓" modal; token persists across requests. | **Tie** |
| **Bulk Concurrency & Loops** | Native Collection Runner for sending 50 rapid requests in loop. | Single request "Try it out" execution. | **Postman / PowerShell** |
| **Automated Verification Scripting** | Postman test tab assertions (`pm.test`). | Interactive test bench (manual inspection of response status/body). | **Postman / PowerShell** |

### Recommendation for Review-2 Strategy:
- **Primary Live Interactive Demonstration Interface:** **Central Gateway Swagger UI (`http://localhost:8080/swagger-ui.html`)** or the embedded **React Swagger Portal (`http://localhost:3000`)**.
- **Secondary Automated Proof Interface:** Keep existing PowerShell verification scripts (`verify-full-system.ps1`, `verify-rbac.ps1`, `verify-load-balancing.ps1`) on standby for instant multi-tenant and load-balancing proof if evaluators ask for bulk automated test execution.

---

## 9. Recommended Review-2 Demonstration Sequence (Using Swagger UI)

A step-by-step 10-minute demonstration plan tailored specifically for the Swagger UI testbench:

### Step 1: Show Unified Swagger Ingress (1 min)
1. Open browser to `http://localhost:8080/swagger-ui.html`.
2. Point out:
   - Header: *PulseFIT AI - API Gateway Ingress*
   - Server: `http://localhost:8080 (API Gateway Ingress (Port 8080))` selected by default.
   - Top-right dropdown showing all 4 microservices dynamically routed via Eureka.

### Step 2: Unauthenticated Login & Signed JWT Issuance (2 min)
1. Under **1. Auth Service (:8081 via Gateway)** -> expand `POST /api/auth/login`.
2. Click **Try it out**.
3. Execute login as Admin:
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
4. Click **Execute**. Show response: `200 OK` with HMAC-SHA256 signed JWT token.
5. Copy the `token` string from the response body.
6. Scroll to the top right of Swagger UI, click the green **Authorize 🔓** button, paste the token into the value box, and click **Authorize**. The lock icon changes to locked 🔒.

### Step 3: Demonstrate Protected Member CRUD via Gateway (2 min)
1. In the top-right definition dropdown, select **2. Member Service (:8082 via Gateway)**.
2. Note that the Authorize lock remains active!
3. Expand `GET /api/members` -> **Try it out** -> **Execute**.
4. Show live `200 OK` response with all registered gym members (`Alex Mercer`, `Sarah Connor`, etc.).
5. Expand `GET /api/members/{memberId}` -> Enter `1` -> **Execute**.
6. Show Member 1 profile details.

### Step 4: Demonstrate Subscription & Membership Plans (2 min)
1. In the definition dropdown, select **3. Subscription Service (:8083 via Gateway)**.
2. Expand `GET /api/plans` -> **Try it out** -> **Execute**.
3. Show active membership tiers (Basic, Premium, All-Access).
4. Expand `POST /api/plans` -> **Try it out**.
5. Fill in sample plan:
   ```json
   {
     "planName": "Review-2 VIP Pass",
     "description": "Exclusive University Demo Pass",
     "durationInDays": 30,
     "price": 79.99,
     "active": true
   }
   ```
6. Click **Execute** -> Show `201 Created` with newly assigned Plan ID.

### Step 5: Demonstrate Turnstile Check-In Decision Engine (2 min)
1. In the definition dropdown, select **4. Attendance Service (:8084 via Gateway)**.
2. Expand `POST /api/attendance/check-in` -> **Try it out**.
3. Test valid check-in for Member 1 at Facility `FACILITY_NORTH`:
   ```json
   {
     "memberId": 1,
     "facilityId": "FACILITY_NORTH",
     "turnstileId": "TURNSTILE_A1"
   }
   ```
4. Click **Execute** -> Show `200 OK` with:
   - `accessGranted: true`
   - `message: "Check-in successful"`
   - Sub-50ms latency (demonstrating Feign inter-service verification).
5. Expand `GET /api/attendance/recent` -> **Execute** -> Show the new check-in recorded at the top of the facility log.

### Step 6: Demonstrate Role-Based Access Denial (BOLA / RBAC) (1 min)
1. Click **Authorize** -> **Logout** -> Paste token for `member_alex` (acquired from login or Frontend Quick Presets).
2. Attempt `POST /api/plans` -> **Execute** -> Show `403 Forbidden` (`Access Denied: Insufficient privileges`).
3. Attempt `GET /api/members/2` (Sarah's profile) -> **Execute** -> Show `403 Forbidden` (`@securityEvaluator.canAccessMember` blocks cross-member data access).
4. Highlight that Swagger accurately captures enterprise security enforcement.

---

## 10. Summary of Exact Changes Required (If Any)

| Area | Change | Priority | Impact |
|---|---|:---:|---|
| **Core Architecture** | **None.** OpenAPI 3, Springdoc 2.5.0, Gateway routing, and JWT authorization are 100% operational. | None | Zero code changes needed for Review-2. |
| **Attendance Service Documentation** | Add `@Tag` and `@Operation` annotations to `AttendanceController` and `AttendanceAiController` methods so Swagger UI displays custom summary titles. | Optional / Low | Purely cosmetic; endpoints are already 100% functional. |
| **Direct Port Iframe Headers** | Add `headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable)` to `member`, `subscription`, and `attendance` `SecurityConfig` if direct port iframing is ever desired. | Optional / Low | Unnecessary if demonstrating via Gateway `:8080` (which is standard practice). |

---

## Conclusion & Review-2 Readiness Verdict

- **Swagger Implementation:** **COMPLETE & VERIFIED AT RUNTIME**
- **Authentication:** **FULLY FUNCTIONAL WITH BEARER JWT**
- **Gateway Ingress:** **CENTRALIZED AT `http://localhost:8080/swagger-ui.html`**
- **Readiness for Review-2:** **100% READY TO REPLACE POSTMAN AS PRIMARY DEMO INTERFACE**

*Audit completed under strict read-only compliance. All services, schemas, and configurations remain untouched.*
