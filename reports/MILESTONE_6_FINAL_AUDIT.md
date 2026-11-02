# PulseFIT AI — Milestone 6: Final System Audit & Stabilization Report

**Author:** Senior Java Spring Boot Microservices Architect & QA Engineer  
**Project:** `E:\PulseFIT-AI`  
**Date:** November 2026  
**Target Review:** Review-2 Assessment  
**Audit Scope:** Read-Only Full-System Architecture, Security, Integration, QA, and Documentation Audit  

---

## 1. Executive Summary

PulseFIT AI has completed Milestones 1 through 5A. This final audit evaluates system stability, security rigor, architectural compliance, and demonstration readiness for Review-2.

### Audit Summary Matrix

| Milestone | Capability | Classification | Verification Summary |
|---|---|:---:|---|
| **Milestone 1** | Gateway Routing & Auth Fixes | `RUNTIME-VERIFIED` | Missing `/api/plans/**` route restored; hardcoded backdoors eliminated; public vs protected routing verified. |
| **Milestone 2** | Subscription Cancellation & Deletion | `RUNTIME-VERIFIED` | `DELETE /api/subscriptions/{id}` implemented, soft/permanent deletion verified, 404 handling verified. |
| **Milestone 3** | Member Service Load Balancing | `RUNTIME-VERIFIED` | 2 instances on `:8082` and `:8085` registered under `MEMBER-SERVICE`; 50/50 round-robin distribution verified. |
| **Milestone 4A** | Sensitive Data & Auth Hardening | `RUNTIME-VERIFIED` | BCrypt password hashing; password hashes stripped from DTOs; authenticated password change implemented. |
| **Milestone 4B** | Downstream JWT Enforcement | `RUNTIME-VERIFIED` | All downstream business services independently validate JWTs; direct unauthenticated requests return HTTP 401. |
| **Milestone 4C** | Role-Based Access Control (RBAC) | `RUNTIME-VERIFIED` | Declarative method security (`@PreAuthorize`) across `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_MEMBER`; identity header spoofing blocked. |
| **Milestone 5** | Full-System Integration | `RUNTIME-VERIFIED` | Multi-service workflow (Member -> Plan -> Subscription -> Turnstile Check-in/out -> Audit) passed end-to-end. |
| **Milestone 5A** | Object-Level Authorization (BOLA/IDOR) | `RUNTIME-VERIFIED` | Verified `memberId` signed JWT claim; cross-member access attempts return HTTP 403 Forbidden across all services. |
| **Milestone 6** | Final Build & Test Suite | `AUTOMATED-TESTED` | 170 Maven tests across all 6 modules: **0 failures, 0 errors, 0 skipped**. BUILD SUCCESS in 1m 00s. |

**Verdict:** The system is **STABLE, SECURE, AND READY FOR REVIEW-2**.

---

## 2. Repository Structure

```
E:\PulseFIT-AI
├── pom.xml                                # Parent POM (Java 17, Spring Boot 3.2.5, Spring Cloud 2023.0.1)
├── docker-compose.yml                     # Multi-container orchestration (MySQL 8.0, Eureka, Gateway, 5 services, Frontend)
├── README.md                              # Main architectural overview
├── SRS_Document.md                        # Software Requirements Specification
├── STS4_Setup_Guide.md                    # Spring Tool Suite 4 execution guide
├── LinkedIn_Article_DTI.md                # Design Thinking & Innovation artifact
├── eureka-server/                         # Module 1: Netflix Eureka Discovery Registry (:8761)
├── api-gateway/                           # Module 2: Spring Cloud Gateway (:8080)
├── auth-service/                          # Module 3: Authentication & JWT Provider (:8081)
├── member-service/                        # Module 4: Member Profiles (:8082, replica :8085)
├── subscription-service/                  # Module 5: Subscriptions & Plans (:8083)
├── attendance-service/                    # Module 6: Turnstile Check-In & Tracking (:8084)
├── frontend/                              # Vite + React Web Application (:3000)
├── postman/                               # Centralized Postman API collection
├── scripts/                               # PowerShell runtime verification suite
│   ├── verify-load-balancing.ps1          # Runtime load-balancing & failover verifier
│   ├── test-crud-operations.ps1           # End-to-end CRUD verifier
│   ├── verify-downstream-jwt.ps1          # Direct downstream 401 enforcement verifier
│   ├── verify-rbac.ps1                    # Fine-grained RBAC matrix verifier
│   ├── verify-object-ownership.ps1        # BOLA/IDOR cross-member access verifier
│   └── verify-full-system.ps1             # Complete lifecycle integration verifier
└── reports/
    └── MILESTONE_6_FINAL_AUDIT.md         # This audit deliverable
```

### Configuration Hygiene Observations
1. **Redundant configuration file:** In `subscription-service/src/main/resources`, both `application.yml` and `application.properties` exist. `application.yml` contains the active `jwt.secret` and database configuration, while `application.properties` is a redundant artifact from early scaffolding. While harmless because `application.yml` settings take precedence, `application.properties` should eventually be archived to maintain single-source configuration.
2. **Standardized dialect warning:** Hibernate emits deprecation warnings regarding explicit `org.hibernate.dialect.MySQLDialect`. Removing the explicit property allows Hibernate to auto-detect the MySQL 8 dialect.

---

## 3. Microservice Implementation Audit

All six microservices were audited for configuration independence, Eureka discovery, OpenFeign client wiring, and startup order.

| Service | Port | Application Name | Database Schema | Primary Responsibilities | Status |
|---|:---:|---|---|---|:---:|
| **Eureka Server** | `8761` | `eureka-server` | None | Service discovery registry, heartbeats, eviction management | `IMPLEMENTED` |
| **API Gateway** | `8080` | `api-gateway` | None | Edge routing (`lb://`), edge JWT validation filter, CORS, header sanitization | `IMPLEMENTED` |
| **Auth Service** | `8081` | `auth-service` | `pulsefit_auth` | User registration, authentication, BCrypt hashing, signed JWT issuance with `memberId` | `IMPLEMENTED` |
| **Member Service (Primary)** | `8082` | `MEMBER-SERVICE` | `pulsefit_member` | Member profile CRUD, status queries, custom port response header | `IMPLEMENTED` |
| **Member Service (Replica)** | `8085` | `MEMBER-SERVICE` | `pulsefit_member` | High availability replica, shared database, load-balanced traffic handling | `IMPLEMENTED` |
| **Subscription Service** | `8083` | `SUBSCRIPTION-SERVICE` | `pulsefit_subscription` | Plans, subscriptions, automated renewals, OpenFeign Member validation | `IMPLEMENTED` |
| **Attendance Service** | `8084` | `ATTENDANCE-SERVICE` | `pulsefit_attendance` | Turnstile check-in/out engine, fraud detection, OpenFeign Member & Subscription validation | `IMPLEMENTED` |

### Eureka Service Discovery Verification
- All downstream business services configure `eureka.client.service-url.defaultZone=http://localhost:8761/eureka/`.
- Gateway routes exclusively use `lb://<SERVICE-NAME>` dynamic discovery URLs:
  - `/api/auth/**` -> `lb://AUTH-SERVICE`
  - `/api/members/**` -> `lb://MEMBER-SERVICE`
  - `/api/subscriptions/**` -> `lb://SUBSCRIPTION-SERVICE`
  - `/api/plans/**` -> `lb://SUBSCRIPTION-SERVICE`
  - `/api/attendance/**` -> `lb://ATTENDANCE-SERVICE`
- Eureka console shows all 6 instances registered with status `UP`.

### Recommended Startup Sequence
1. `eureka-server` (`:8761`) — wait 10s for registry initialization.
2. `auth-service` (`:8081`) — registers and initializes credentials.
3. `member-service` (`:8082`) and `member-service` replica (`:8085`).
4. `subscription-service` (`:8083`).
5. `attendance-service` (`:8084`).
6. `api-gateway` (`:8080`) — discovers all registered instances.

---

## 4. JWT Authentication Audit

| Security Control | Implementation Mechanism | Audit Findings | Status |
|---|---|---|:---:|
| **Signing Algorithm** | HMAC-SHA256 (HS256) via JJWT 0.11.5 | Uniformly configured with a 256-bit secret key across all 6 services. | `IMPLEMENTED` |
| **Password Storage** | BCrypt (`BCryptPasswordEncoder`) | Strong one-way salted hashing. Plaintext passwords never stored. | `IMPLEMENTED` |
| **Token Payload Claims** | `sub` (username), `role`, `memberId`, `iat`, `exp` | Signed claim `memberId` embedded by Auth Service when user maps to a gym member. | `IMPLEMENTED` |
| **Token Expiry** | 24 Hours (`86,400,000 ms`) | Expiry enforced by `Jwts.parserBuilder()`. Expired tokens rejected. | `IMPLEMENTED` |
| **Gateway Enforcement** | `JwtAuthenticationFilter` (Global / Route filter) | Inspects `Authorization: Bearer <token>`; rejects missing/malformed tokens with HTTP 401. | `RUNTIME-VERIFIED` |
| **Downstream Independent Validation** | `JwtAuthenticationFilter` in each business service | Downstream services decode and validate signature independently; direct calls without token return HTTP 401. | `RUNTIME-VERIFIED` |
| **Sensitive Data Exposure Prevention** | `UserDto` response object | Password hashes stripped; `GET /api/auth/users` restricted to `ROLE_ADMIN`. | `RUNTIME-VERIFIED` |

---

## 5. RBAC and BOLA Security Audit

### Role-Based Access Control (RBAC) Matrix
Enforced via Spring Security's `@EnableMethodSecurity(prePostEnabled = true)` and `@PreAuthorize`:

| Resource Endpoint | HTTP Method | ROLE_ADMIN | ROLE_STAFF | ROLE_MEMBER | Unauthenticated |
|---|:---:|:---:|:---:|:---:|:---:|
| `/api/auth/users` | `GET` | **200 OK** | 403 Forbidden | 403 Forbidden | 401 Unauthorized |
| `/api/members` (List all) | `GET` | **200 OK** | **200 OK** | **200 OK** | 401 Unauthorized |
| `/api/members` (Create) | `POST` | **201 Created** | **201 Created** | 403 Forbidden | 401 Unauthorized |
| `/api/members/{id}` (Update) | `PUT` | **200 OK** | **200 OK** | 403 Forbidden | 401 Unauthorized |
| `/api/members/{id}` (Delete) | `DELETE` | **200 OK** | 403 Forbidden | 403 Forbidden | 401 Unauthorized |
| `/api/plans` (Create Plan) | `POST` | **201 Created** | **201 Created** | 403 Forbidden | 401 Unauthorized |
| `/api/plans/{id}` (Delete Plan) | `DELETE` | **200 OK** | **200 OK** | 403 Forbidden | 401 Unauthorized |
| `/api/subscriptions/{id}` (Delete) | `DELETE` | **204 No Content** | **204 No Content** | 403 Forbidden | 401 Unauthorized |
| `/api/attendance/ai/fraud-alerts` | `GET` | **200 OK** | **200 OK** | 403 Forbidden | 401 Unauthorized |

### Broken Object Level Authorization (BOLA/IDOR) Ownership Matrix
Enforced via `@PreAuthorize("@securityEvaluator.canAccessMember(#memberId)")`:

| Protected Endpoint | Target Resource | ROLE_ADMIN | ROLE_STAFF | ROLE_MEMBER (Own ID) | ROLE_MEMBER (Other ID) | Unmapped MEMBER |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `GET /api/members/{memberId}` | Profile | **200 OK** | **200 OK** | **200 OK** | **403 Forbidden** | **403 Forbidden** |
| `GET /api/members/{memberId}/status` | Status | **200 OK** | **200 OK** | **200 OK** | **403 Forbidden** | **403 Forbidden** |
| `GET /api/subscriptions/member/{memberId}` | Subscriptions | **200 OK** | **200 OK** | **200 OK** | **403 Forbidden** | **403 Forbidden** |
| `GET /api/subscriptions/member/{memberId}/active` | Active Pass | **200 OK** | **200 OK** | **200 OK** | **403 Forbidden** | **403 Forbidden** |
| `POST /api/subscriptions` | Body `memberId` | **201 Created** | **201 Created** | **201 Created** | **403 Forbidden** | **403 Forbidden** |
| `GET /api/attendance/member/{memberId}` | History | **200 OK** | **200 OK** | **200 OK** | **403 Forbidden** | **403 Forbidden** |
| `POST /api/attendance/check-in` | Body `memberId` | **200 OK** | **200 OK** | **200 OK** | **403 Forbidden** | **403 Forbidden** |
| `POST /api/attendance/check-out` | Body `memberId` | **200 OK** | **200 OK** | **200 OK** | **403 Forbidden** | **403 Forbidden** |

### Identity Header Spoofing Resistance
- API Gateway `JwtAuthenticationFilter` automatically strips client-supplied `X-User-Name`, `X-User-Role`, and `X-User-Id` headers before routing downstream.
- Downstream microservices do NOT rely on client headers for authorization decisions; authorization is derived strictly from the verified Spring Security `SecurityContextHolder`.

---

## 6. CRUD Operations Audit

| Microservice | Entity | Operations Implemented | Controller | Service | Status |
|---|---|---|---|---|:---:|
| **Member Service** | `Member` | Create (`POST`), Read All (`GET`), Read One (`GET /{id}`), Update (`PUT /{id}`), Delete (`DELETE /{id}`) | `MemberController` | `MemberService` | `RUNTIME-VERIFIED` |
| **Subscription Service** | `MembershipPlan` | Create (`POST`), Read All (`GET`), Read One (`GET /{id}`), Update (`PUT /{id}`), Delete (`DELETE /{id}`) | `MembershipPlanController` | `MembershipPlanService` | `RUNTIME-VERIFIED` |
| **Subscription Service** | `Subscription` | Create (`POST`), Read All (`GET`), Read Active (`GET /member/{id}/active`), Renew (`POST /{id}/renew`), Delete (`DELETE /{id}`) | `SubscriptionController` | `SubscriptionService` | `RUNTIME-VERIFIED` |
| **Attendance Service** | `Attendance` | Check-in (`POST /check-in`), Check-out (`POST /check-out`), Read History (`GET /member/{id}`), Read Recent (`GET /recent`), Fraud Alerts (`GET /ai/fraud-alerts`) | `AttendanceController`, `AttendanceAiController` | `AttendanceService`, `AiTurnstileAnomalyService` | `RUNTIME-VERIFIED` |
| **Auth Service** | `User` | Register (`POST /register`), Login (`POST /login`), Social Login (`POST /social-login`), Change Password (`POST /change-password`), List Users (`GET /users`) | `AuthController` | `AuthService` | `RUNTIME-VERIFIED` |

---

## 7. Load-Balancing Audit

The load-balancing setup for Review-2 was verified under runtime traffic:

- **Target Service:** `MEMBER-SERVICE`
- **Instance 1:** `localhost:8082` (Instance ID: `member-service:8082`, Status: `UP`)
- **Instance 2:** `localhost:8085` (Instance ID: `member-service:8085`, Status: `UP`)
- **Load Balancer:** Spring Cloud LoadBalancer (Reactive Round-Robin with 2-second cache TTL)
- **Tracing Header:** Each instance injects `X-Handled-By-Port: <port>` into response headers.

### Live Traffic Distribution Evidence
Executed `scripts/verify-load-balancing.ps1 -RequestCount 20` through Gateway (`http://localhost:8080/api/members`):

```
Instance Distribution (20 Requests):
  - Instance 1 (Port 8082): 10 requests (50.0%)
  - Instance 2 (Port 8085): 10 requests (50.0%)
  - Failed Requests: 0
```
Perfect alternating round-robin distribution verified.

---

## 8. Feign Integration Audit

PulseFIT AI enforces strict inter-service validation across microservices using Spring Cloud OpenFeign:

```
[ Client Check-In Request ]
            │
            ▼
┌───────────────────────────┐
│     Attendance Service    │
│        (Port 8084)        │
└─────────────┬─────────────┘
              │
              ├──► OpenFeign (MemberServiceClient) ────► Member Service (:8082 / :8085)
              │    Validates: Member exists and status == 'ACTIVE'
              │
              └──► OpenFeign (SubscriptionServiceClient) ─► Subscription Service (:8083)
                   Validates: Active, non-expired subscription for facility tier
```

### Feign Security Context Propagation
Both `subscription-service` and `attendance-service` configure `FeignClientInterceptor`:
```java
@Configuration
public class FeignClientInterceptor implements RequestInterceptor {
    @Override
    public void apply(RequestTemplate template) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && !authHeader.isBlank()) {
                template.header(HttpHeaders.AUTHORIZATION, authHeader);
            }
        }
    }
}
```
This ensures downstream Feign calls carry the authenticated caller's JWT token, allowing downstream services to independently validate identity and permissions without bypass vulnerabilities.

---

## 9. Database Audit

PulseFIT AI utilizes MySQL 8.0 across 4 physically isolated schemas:

| Schema Name | Owner Microservice | Primary Tables | Primary Key Strategy | Cross-DB Foreign Keys |
|---|---|---|---|:---:|
| `pulsefit_auth` | Auth Service | `users` | `BIGINT AUTO_INCREMENT` | **None (Decoupled)** |
| `pulsefit_member` | Member Service | `member` | `BIGINT AUTO_INCREMENT` | **None (Decoupled)** |
| `pulsefit_subscription` | Subscription Service | `subscription`, `membership_plan` | `BIGINT AUTO_INCREMENT` | **None (Decoupled)** |
| `pulsefit_attendance` | Attendance Service | `attendance` | `BIGINT AUTO_INCREMENT` | **None (Decoupled)** |

### Schema Isolation Compliance
- No foreign key constraints cross database boundaries.
- Cross-service references (e.g. `subscription.member_id`, `attendance.member_id`) are maintained logically and validated at runtime via OpenFeign REST clients.
- Automated tests use isolated in-memory H2 databases (`jdbc:h2:mem:...;MODE=MySQL`) so test execution never mutates MySQL operational data.

---

## 10. Automated Test Results

Full-suite execution executed during Phase 6:
`mvn test -pl eureka-server,api-gateway,auth-service,member-service,subscription-service,attendance-service -am`

```
[INFO] Reactor Summary for PulseFIT AI - Multi-Facility Fitness Platform 1.0.0:
[INFO] 
[INFO] PulseFIT AI - Multi-Facility Fitness Platform ...... SUCCESS [  0.004 s]
[INFO] PulseFIT Eureka Discovery Server ................... SUCCESS [  8.389 s]
[INFO] PulseFIT API Gateway ............................... SUCCESS [  5.904 s]
[INFO] PulseFIT Auth Service .............................. SUCCESS [ 12.237 s]
[INFO] PulseFIT Member Service ............................ SUCCESS [  9.442 s]
[INFO] PulseFIT Subscription Service ...................... SUCCESS [ 12.408 s]
[INFO] PulseFIT Attendance Service ........................ SUCCESS [ 11.159 s]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time: 01:00 min
[INFO] Finished at: 2026-11-02T01:29:45+05:30
```

### Module Test Inventory

| Module | Test Class | Test Count | Failures | Errors | Skipped | Status |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `eureka-server` | `EurekaServerApplicationTests` | 1 | 0 | 0 | 0 | `AUTOMATED-TESTED` |
| `api-gateway` | `ApiGatewayApplicationTests` | 9 | 0 | 0 | 0 | `AUTOMATED-TESTED` |
| `auth-service` | `AuthServiceTests` | 15 | 0 | 0 | 0 | `AUTOMATED-TESTED` |
| `auth-service` | `AuthSecurityControllerTests` | 7 | 0 | 0 | 0 | `AUTOMATED-TESTED` |
| `member-service` | `MemberControllerTests` | 9 | 0 | 0 | 0 | `AUTOMATED-TESTED` |
| `member-service` | `MemberServiceTests` | 12 | 0 | 0 | 0 | `AUTOMATED-TESTED` |
| `member-service` | `MemberSecurityControllerTests` | 19 | 0 | 0 | 0 | `AUTOMATED-TESTED` |
| `member-service` | `PortHeaderFilterTests` | 4 | 0 | 0 | 0 | `AUTOMATED-TESTED` |
| `subscription-service` | `SubscriptionControllerTests` | 12 | 0 | 0 | 0 | `AUTOMATED-TESTED` |
| `subscription-service` | `SubscriptionServiceTests` | 18 | 0 | 0 | 0 | `AUTOMATED-TESTED` |
| `subscription-service` | `MembershipPlanControllerTests` | 9 | 0 | 0 | 0 | `AUTOMATED-TESTED` |
| `subscription-service` | `MembershipPlanServiceTests` | 10 | 0 | 0 | 0 | `AUTOMATED-TESTED` |
| `subscription-service` | `SubscriptionSecurityControllerTests` | 23 | 0 | 0 | 0 | `AUTOMATED-TESTED` |
| `attendance-service` | `AttendanceSecurityControllerTests` | 19 | 0 | 0 | 0 | `AUTOMATED-TESTED` |
| `attendance-service` | `AttendanceServiceTests` | 3 | 0 | 0 | 0 | `AUTOMATED-TESTED` |
| **TOTAL** | **15 Test Classes** | **170** | **0** | **0** | **0** | **100% PASS** |

---

## 11. Runtime Verification Evidence

All 5 PowerShell verification scripts under `scripts/` were executed against live running services through the API Gateway:

```powershell
# 1. Load Balancing Verification
powershell -ExecutionPolicy Bypass -File scripts\verify-load-balancing.ps1 -RequestCount 20
# Result: 20/20 requests succeeded (10 on :8082, 10 on :8085). 100% Pass.

# 2. CRUD Operations Verification
powershell -ExecutionPolicy Bypass -File scripts\test-crud-operations.ps1
# Result: Member CRUD, Subscription CRUD with Feign verification, Attendance check, Cleanup. 100% Pass.

# 3. Role-Based Access Control (RBAC) Verification
powershell -ExecutionPolicy Bypass -File scripts\verify-rbac.ps1
# Result: 26 passed, 0 failed. Identity spoofing protection verified. 100% Pass.

# 4. Object-Level Ownership (BOLA/IDOR) Verification
powershell -ExecutionPolicy Bypass -File scripts\verify-object-ownership.ps1
# Result: 32 passed, 0 failed. Cross-member 403 enforcement verified. 100% Pass.

# 5. Full-System Integration Verification
powershell -ExecutionPolicy Bypass -File scripts\verify-full-system.ps1
# Result: 35 passed, 0 failed. Complete 7-step member-to-turnstile lifecycle verified. 100% Pass.
```

**Total Runtime Assertions Verified:** **133 passed, 0 failed.**

---

## 12. Documentation Gaps

Inspection of [README.md](file:///E:/PulseFIT-AI/README.md) revealed the following documentation discrepancies:

1. **Database Stack Outdated:** `README.md` lines 51–54 list databases as in-memory H2 (`H2 authdb`, `H2 memberdb`, etc.). In production, all services run on MySQL 8.0 (`pulsefit_auth`, `pulsefit_member`, etc.).
2. **Missing MySQL Setup Guide:** `README.md` lacks instructions for creating the required MySQL database schemas (`pulsefit_auth`, `pulsefit_member`, `pulsefit_subscription`, `pulsefit_attendance`).
3. **Missing Port 8085 in Architecture Diagram:** The ASCII diagram lists Member Service on Port 8082 only. The load-balanced replica on port 8085 is omitted.
4. **Missing Replica Startup Instructions:** The startup instructions do not document how to run the Member Service replica (`--server.port=8085`).
5. **Missing Demo Credentials Table:** `README.md` lacks default demonstration credentials (`admin`/`admin123`, `staff_john`/`staff123`, `member_alex`/`alex123`, `member_sarah`/`sarah123`).
6. **Missing PowerShell Verification Script Documentation:** The 5 verification scripts in `scripts/` are not documented.
7. **Missing Endpoints in API Documentation:** Endpoints for `/api/plans/**`, password management, and BOLA-protected routes are not itemized.

*(Per Milestone 6 rules, these gaps are documented without modifying `README.md`).*

---

## 13. Remaining Risks and Limitations

1. **Decoupled User-Member Provisioning:**
   - While `pulsefit_auth.users.member_id` reliably establishes ownership for JWT claims, user registration (`/api/auth/register`) and member profile creation (`/api/members`) are currently two distinct REST operations. A future milestone could implement an event-driven saga (e.g. RabbitMQ or Kafka) or transactional coordinator to provision both atomically.
2. **Stateless Token Invalidation:**
   - Tokens remain valid until expiration (24 hours). If a member's account status is changed to `INACTIVE` in Member Service, their active JWT remains cryptographically valid until expiry. While Attendance Service turnstile checks mitigate this by actively checking member status via Feign on every entry attempt, non-turnstile endpoints trust the JWT until expiration. A distributed Redis token blacklist could be added in future iterations.
3. **Configuration Redundancy:**
   - `subscription-service` contains both `application.yml` and `application.properties`. Retaining only `application.yml` is recommended for cleanliness.

---

## 14. Review-2 Readiness Assessment

| Evaluation Area | Review-2 Rubric Expectation | Demonstrated System Capability | Assessment |
|---|---|---|:---:|
| **Architecture & Decomposition** | Microservices with independent databases and service discovery | 6 isolated modules, Eureka server, Spring Cloud Gateway, OpenFeign, 4 MySQL databases | **EXCEEDS** |
| **Runtime Load Balancing** | Multi-instance load balancing with demonstrable distribution | 2 Member Service instances (:8082 & :8085) with round-robin traffic distribution verified | **EXCEEDS** |
| **JWT Authentication** | HMAC-SHA256 tokens, edge validation, downstream enforcement | Gateway edge validation + independent downstream validation + BCrypt password hashing | **EXCEEDS** |
| **Role-Based Authorization** | Differentiated access for Admin, Staff, Member | Method-level `@PreAuthorize` across all business endpoints; header spoofing blocked | **EXCEEDS** |
| **Object-Level Authorization** | Prevention of BOLA/IDOR vulnerabilities | Verified signed `memberId` claims; cross-member attempts return HTTP 403 Forbidden | **EXCEEDS** |
| **CRUD & Business Workflows** | Complete business domain operations | Full Member, Plan, Subscription, Attendance lifecycle with OpenFeign validation | **EXCEEDS** |
| **Automated Testing** | Unit, integration, and security test suites | 170 passing Maven tests (0 failures, 0 errors, 0 skipped); 15 test classes | **EXCEEDS** |
| **Runtime Verification** | Reproducible demonstration scripts | 5 automated PowerShell scripts covering 133 runtime assertions with 100% success | **EXCEEDS** |

### Final Readiness Verdict
```
================================================================================
             PULSEFIT AI — REVIEW-2 AUDIT ASSESSMENT: READY FOR DEMONSTRATION
================================================================================
  All functional, security, load-balancing, and integration requirements
  are verified with 100% automated and runtime evidence.
================================================================================
```
