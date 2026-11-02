# PulseFIT AI — Multi-Facility Fitness Platform

[![Java 17](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot 3.2.5](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Spring Cloud 2023.0.1](https://img.shields.io/badge/Spring%20Cloud-2023.0.1-blue.svg)](https://spring.io/projects/spring-cloud)
[![MySQL 8.0](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-170%20Passed-success.svg)](file:///E:/PulseFIT-AI)
[![BOLA / IDOR Protected](https://img.shields.io/badge/Security-BOLA%2FIDOR%20Protected-brightgreen.svg)](file:///E:/PulseFIT-AI)

An enterprise-grade Service-Oriented Architecture (SOA) and Microservices platform engineered for **PulseFit Health Clubs** to orchestrate member profiles, subscription lifecycles, and high-speed physical turnstile check-in access control across multiple gym facilities.

---

## Table of Contents

1. [Project Overview & Objectives](#1-project-overview--objectives)
2. [Features & User Roles](#2-features--user-roles)
3. [Technology Stack](#3-technology-stack)
4. [Microservices Architecture](#4-microservices-architecture)
5. [Architecture Diagram](#5-architecture-diagram)
6. [Service Ports & Responsibilities](#6-service-ports--responsibilities)
7. [MySQL 8.0 Database Architecture](#7-mysql-80-database-architecture)
8. [Database Schemas & Setup](#8-database-schemas--setup)
9. [Environment Variables & JWT Configuration](#9-environment-variables--jwt-configuration)
10. [Application Startup Sequence](#10-application-startup-sequence)
11. [Multi-Instance Member Service Setup (Port 8085)](#11-multi-instance-member-service-setup-port-8085)
12. [Complete API Endpoint Inventory](#12-complete-api-endpoint-inventory)
13. [Authentication & Authorization Flow](#13-authentication--authorization-flow)
14. [RBAC & BOLA / IDOR Protection](#14-rbac--bola--idor-protection)
15. [OpenFeign Inter-Service Communication & Token Propagation](#15-openfeign-inter-service-communication--token-propagation)
16. [CRUD Operations Quick Reference](#16-crud-operations-quick-reference)
17. [Runtime Load Balancing Verification](#17-runtime-load-balancing-verification)
18. [Automated Testing Instructions](#18-automated-testing-instructions)
19. [PowerShell Verification Suite](#19-powershell-verification-suite)
20. [Development Demo Credentials](#20-development-demo-credentials)

---

## 1. Project Overview & Objectives

PulseFit operates multiple gym facilities across urban centers. Managing member profiles, active subscriptions, and real-time physical turnstile entry across disparate facilities requires high availability, strict isolation, and sub-second verification latency.

### Core Architectural Objectives
- **Domain Decomposition:** Decoupled business capabilities into independent, self-contained microservices using Domain-Driven Design (DDD).
- **Service Discovery & Resiliency:** Netflix Eureka coordinates dynamic client registration and health heartbeats.
- **Runtime Load Balancing:** Spring Cloud LoadBalancer distributes client traffic across multiple instances of Member Service (`:8082` and `:8085`).
- **Zero-Trust Security:** Two-tier security with edge authentication at Spring Cloud Gateway (`:8080`) combined with independent downstream JWT signature validation in every business service.
- **Role-Based Access Control (RBAC):** Method-level authorization (`@PreAuthorize`) differentiating `ROLE_ADMIN`, `ROLE_STAFF`, and `ROLE_MEMBER`.
- **Object-Level Authorization (BOLA/IDOR Prevention):** Signed `memberId` JWT claims ensure member users can only query and manipulate their own records.
- **Data Isolation:** Database-per-service pattern with four dedicated MySQL 8.0 databases.

---

## 2. Features & User Roles

### User Roles & Permissions

| Role | Access Scope | Key Capabilities |
|---|---|---|
| **ROLE_ADMIN** | System-Wide Full Authority | Manage all members, delete member records, manage plans, cancel/delete subscriptions, view turnstile fraud alerts, list user accounts. |
| **ROLE_STAFF** | Facility Operations | Create and update member profiles, create and manage plans, cancel/delete subscriptions, inspect turnstile access logs and fraud alerts. |
| **ROLE_MEMBER** | Self-Service Only | View personal profile, view personal active subscription, purchase personal pass, access turnstile check-in, inspect personal attendance history. **Blocked from other members' records.** |

---

## 3. Technology Stack

- **Platform:** Java 17 (LTS)
- **Framework:** Spring Boot 3.2.5
- **Cloud Infrastructure:** Spring Cloud 2023.0.1
- **Service Discovery:** Netflix Eureka Server & Eureka Client
- **API Gateway:** Spring Cloud Gateway (Reactive / Netty)
- **Inter-Service REST:** Spring Cloud OpenFeign & Spring Cloud LoadBalancer
- **Security:** Spring Security 6.2, JJWT 0.11.5 (HMAC-SHA256 HS256)
- **Persistence:** Spring Data JPA / Hibernate ORM
- **Database:** MySQL 8.0 (Production / Dev), H2 Database (Test Profile)
- **Documentation & UI:** Springdoc OpenAPI / Swagger UI 2.5.0
- **Build Tool:** Apache Maven 3.9+
- **IDE Support:** Spring Tool Suite 4 (STS4), IntelliJ IDEA, VS Code

---

## 4. Microservices Architecture

PulseFIT AI is decomposed into six standalone Maven modules managed under a root parent POM (`pom.xml`):

1. **`eureka-server`:** Central service discovery and heartbeat registry (`:8761`).
2. **`api-gateway`:** Reactive edge entry point, routing (`lb://`), global CORS, and edge JWT validation (`:8080`).
3. **`auth-service`:** User registration, BCrypt password hashing, authentication, and JWT token issuance (`:8081`).
4. **`member-service`:** Member profile lifecycle, contact info, membership status, dual-instance load balancing (`:8082` & `:8085`).
5. **`subscription-service`:** Plans, subscriptions, validity date calculation, automated renewals, OpenFeign Member validation (`:8083`).
6. **`attendance-service`:** Turnstile entry decision engine, check-in/out logs, AI anomaly detection, OpenFeign Member & Subscription verification (`:8084`).

---

## 5. Architecture Diagram

```
                                  ┌───────────────────────────┐
                                  │   Eureka Discovery Server │
                                  │         (Port 8761)       │
                                  └─────────────┬─────────────┘
                                                │ (Registration & Heartbeats)
                                                ▼
                                  ┌───────────────────────────┐
       Client / Turnstile ──────► │    Spring Cloud Gateway   │
                                  │         (Port 8080)       │
                                  └─────────────┬─────────────┘
          ┌─────────────────────────────────────┼─────────────────────────────────────┐
          │ (Public: /api/auth/**)              │ (Protected + JWT)                   │ (Protected + JWT)
          ▼                                     ▼                                     ▼
┌───────────────────┐               ┌───────────────────────┐             ┌───────────────────────┐
│    Auth Service   │               │     Member Service    │             │  Subscription Service │
│    (Port 8081)    │               │  Inst 1: 8082         │             │      (Port 8083)      │
│   [pulsefit_auth] │               │  Inst 2: 8085 (Replica)             │[pulsefit_subscription]│
└───────────────────┘               │   [pulsefit_member]   │             └───────────▲───────────┘
                                    └───────────▲───────────┘                         │
                                                │                                     │
                                                │ (OpenFeign)                         │ (OpenFeign)
                                                │                                     │
                                                ├─────────────────────────────────────┘
                                                │
                                                │ (OpenFeign: Member & Subscription Validity)
                                                ▼
                                    ┌───────────────────────┐
                                    │   Attendance Service  │
                                    │      (Port 8084)      │
                                    │ [pulsefit_attendance] │
                                    └───────────────────────┘
```

---

## 6. Service Ports & Responsibilities

| Module | Service Name | Port | Database | Primary Responsibility |
|---|---|:---:|---|---|
| `eureka-server` | `eureka-server` | **8761** | None | Service registry dashboard (`http://localhost:8761`) |
| `api-gateway` | `api-gateway` | **8080** | None | Single entry point, routing (`lb://`), CORS, edge JWT filter |
| `auth-service` | `AUTH-SERVICE` | **8081** | `pulsefit_auth` | User accounts, BCrypt passwords, JWT issuance with `memberId` claim |
| `member-service` | `MEMBER-SERVICE` | **8082** | `pulsefit_member` | Member profile CRUD, status queries, port tracking header (Inst 1) |
| `member-service` | `MEMBER-SERVICE` | **8085** | `pulsefit_member` | High availability replica, shared database, load-balanced traffic (Inst 2) |
| `subscription-service` | `SUBSCRIPTION-SERVICE` | **8083** | `pulsefit_subscription` | Plans, subscriptions, automated renewals, Feign Member validation |
| `attendance-service` | `ATTENDANCE-SERVICE` | **8084** | `pulsefit_attendance` | Turnstile check-in/out engine, Feign Member & Subscription verification |

---

## 7. MySQL 8.0 Database Architecture

The platform strictly enforces the **Database-per-Service** pattern. Each microservice connects to its own independent MySQL schema on `localhost:3306`:

- **`pulsefit_auth`:** Credentials, BCrypt hashes, roles, optional `member_id` linkage.
- **`pulsefit_member`:** Full names, contact details, addresses, emergency contacts, active status.
- **`pulsefit_subscription`:** Membership plan templates, active member subscriptions, validity dates, facility tiers.
- **`pulsefit_attendance`:** Physical turnstile scan logs, check-in/out timestamps, access granted/denied audit trail.

---

## 8. Database Schemas & Setup

### MySQL Database Initialization
Run the following commands in MySQL 8.0:

```sql
CREATE DATABASE IF NOT EXISTS pulsefit_auth;
CREATE DATABASE IF NOT EXISTS pulsefit_member;
CREATE DATABASE IF NOT EXISTS pulsefit_subscription;
CREATE DATABASE IF NOT EXISTS pulsefit_attendance;
```

Hibernate `ddl-auto: update` automatically generates and updates table structures upon microservice startup.

### Table Definitions

#### 1. `pulsefit_auth.users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGINT` | PK, Auto Increment | Internal auth account ID |
| `username` | `VARCHAR(50)` | Unique, Not Null | Login username |
| `password` | `VARCHAR(255)` | Not Null | BCrypt salted hash |
| `email` | `VARCHAR(100)` | Unique, Not Null | Account email address |
| `role` | `VARCHAR(20)` | Not Null | `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_MEMBER` |
| `member_id` | `BIGINT` | Nullable | Link to Member record (for MEMBER role) |

#### 2. `pulsefit_member.member`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `member_id` | `BIGINT` | PK, Auto Increment | Unique member identifier |
| `name` | `VARCHAR(100)` | Not Null | Member legal display name |
| `email` | `VARCHAR(100)` | Unique, Not Null | Member contact email |
| `contact` | `VARCHAR(25)` | Not Null | Phone contact number |
| `address` | `VARCHAR(255)` | Nullable | Residential address |
| `emergency_contact` | `VARCHAR(25)` | Nullable | Emergency telephone number |
| `status` | `VARCHAR(20)` | Not Null | `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| `created_at` | `DATETIME(6)` | Nullable | Record creation timestamp |

#### 3. `pulsefit_subscription.subscription`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `subscription_id` | `BIGINT` | PK, Auto Increment | Unique subscription record ID |
| `member_id` | `BIGINT` | Not Null | Logical reference to Member |
| `plan_type` | `VARCHAR(50)` | Not Null | `BASIC_MONTHLY`, `PREMIUM_QUARTERLY`, `ALL_ACCESS_ANNUAL` |
| `start_date` | `DATE` | Not Null | Subscription commencement date |
| `expiry_date` | `DATE` | Not Null | Subscription termination date |
| `status` | `VARCHAR(20)` | Not Null | `ACTIVE`, `EXPIRED`, `CANCELLED` |
| `facility_tier` | `VARCHAR(30)` | Nullable | `SINGLE_FACILITY`, `MULTI_FACILITY`, `ALL_ACCESS` |
| `price` | `DOUBLE` | Nullable | Subscription cost charged |
| `auto_renew` | `BIT(1)` | Nullable | Auto-renewal flag |
| `created_at` | `DATETIME(6)` | Nullable | Creation timestamp |

#### 4. `pulsefit_subscription.membership_plan`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `plan_id` | `BIGINT` | PK, Auto Increment | Plan identifier |
| `plan_name` | `VARCHAR(100)` | Not Null | Plan display title |
| `plan_type` | `VARCHAR(50)` | Not Null | Tier category identifier |
| `duration_days` | `INT` | Not Null | Subscription validity duration |
| `price` | `DOUBLE` | Not Null | Standard plan pricing |
| `facility_tier` | `VARCHAR(50)` | Not Null | Access entitlement tier |
| `description` | `VARCHAR(255)` | Nullable | Marketing description |

#### 5. `pulsefit_attendance.attendance`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `attendance_id` | `BIGINT` | PK, Auto Increment | Unique log entry ID |
| `member_id` | `BIGINT` | Not Null | Logical reference to Member |
| `facility_id` | `VARCHAR(50)` | Not Null | Turnstile facility identifier |
| `facility_name` | `VARCHAR(100)` | Nullable | Turnstile facility name |
| `check_in_time` | `DATETIME(6)` | Not Null | Turnstile entry timestamp |
| `check_out_time` | `DATETIME(6)` | Nullable | Turnstile exit timestamp |
| `access_status` | `VARCHAR(20)` | Not Null | `GRANTED`, `DENIED` |
| `denial_reason` | `VARCHAR(255)` | Nullable | Failure explanation if denied |

---

## 9. Environment Variables & JWT Configuration

| Variable | Default Value | Description |
|---|---|---|
| `JWT_SECRET` | `PulseFitSuperSecretKeyForJWTHMACSHA256EnterpriseSecurity2024!` | 256-bit secret key used for HMAC-SHA256 signing |
| `SPRING_DATASOURCE_USERNAME` | `root` | MySQL username across all services |
| `SPRING_DATASOURCE_PASSWORD` | `root` | MySQL password across all services |
| `PULSEFIT_GATEWAY_URL` | `http://localhost:8080` | Target Gateway endpoint for verification scripts |
| `PULSEFIT_AUTH_URL` | `http://localhost:8081` | Direct Auth Service endpoint |

---

## 10. Application Startup Sequence

To ensure Eureka discovery registries populate cleanly, launch microservices in this sequence:

```powershell
# Step 1: Start Eureka Discovery Server (Wait ~10 seconds)
java -jar eureka-server/target/eureka-server-1.0.0.jar

# Step 2: Start Auth Service
java -jar auth-service/target/auth-service-1.0.0.jar

# Step 3: Start Member Service Instance 1
java -jar member-service/target/member-service-1.0.0.jar

# Step 4: Start Member Service Instance 2 (Load Balancing Replica)
java -jar member-service/target/member-service-1.0.0.jar --server.port=8085

# Step 5: Start Subscription Service
java -jar subscription-service/target/subscription-service-1.0.0.jar

# Step 6: Start Attendance Service
java -jar attendance-service/target/attendance-service-1.0.0.jar

# Step 7: Start API Gateway
java -jar api-gateway/target/api-gateway-1.0.0.jar
```

Verify Eureka registry at `http://localhost:8761` shows all six instances with status `UP`.

---

## 11. Multi-Instance Member Service Setup (Port 8085)

Member Service runs in a high-availability dual-instance configuration:
- **Instance 1:** Starts with default configuration on port **8082**.
- **Instance 2:** Starts by overriding the server port via `--server.port=8085`.

Both instances connect to the exact same MySQL database (`pulsefit_member`), register under the identical Eureka application name `MEMBER-SERVICE`, and dynamically share incoming traffic routed through API Gateway (`http://localhost:8080/api/members`).

---

## 12. Complete API Endpoint Inventory

All endpoints are accessible through the API Gateway on port **8080**:

### Auth Service (`/api/auth/**`)
| Method | Endpoint | Access Policy | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate and obtain signed JWT |
| `POST` | `/api/auth/social-login` | Public | Authenticate via OAuth provider |
| `POST` | `/api/auth/change-password` | Authenticated | Change caller password |
| `GET` | `/api/auth/users` | `ROLE_ADMIN` | List all users (safe DTO without hashes) |

### Member Service (`/api/members/**`)
| Method | Endpoint | Access Policy | Description |
|---|---|---|---|
| `GET` | `/api/members` | `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_MEMBER` | List all member profiles |
| `POST` | `/api/members` | `ROLE_ADMIN`, `ROLE_STAFF` | Create new member profile |
| `GET` | `/api/members/{memberId}` | `ROLE_ADMIN`, `ROLE_STAFF`, or Own ID | Retrieve member profile (BOLA-protected) |
| `PUT` | `/api/members/{memberId}` | `ROLE_ADMIN`, `ROLE_STAFF` | Update member profile |
| `DELETE` | `/api/members/{memberId}` | `ROLE_ADMIN` | Permanently delete member record |
| `GET` | `/api/members/{memberId}/status` | `ROLE_ADMIN`, `ROLE_STAFF`, or Own ID | Query member active status (BOLA-protected) |

### Subscription Service (`/api/plans/**` and `/api/subscriptions/**`)
| Method | Endpoint | Access Policy | Description |
|---|---|---|---|
| `GET` | `/api/plans` | `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_MEMBER` | List active membership plans |
| `POST` | `/api/plans` | `ROLE_ADMIN`, `ROLE_STAFF` | Create new plan template |
| `GET` | `/api/plans/{id}` | `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_MEMBER` | Get plan details |
| `PUT` | `/api/plans/{id}` | `ROLE_ADMIN`, `ROLE_STAFF` | Update plan template |
| `DELETE` | `/api/plans/{id}` | `ROLE_ADMIN`, `ROLE_STAFF` | Delete plan template |
| `GET` | `/api/subscriptions` | `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_MEMBER` | List all subscriptions |
| `POST` | `/api/subscriptions` | `ROLE_ADMIN`, `ROLE_STAFF`, or Own ID | Purchase subscription (Feign verified) |
| `GET` | `/api/subscriptions/{id}` | `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_MEMBER` | Get subscription by ID |
| `GET` | `/api/subscriptions/member/{memberId}` | `ROLE_ADMIN`, `ROLE_STAFF`, or Own ID | List member subscriptions (BOLA-protected) |
| `GET` | `/api/subscriptions/member/{memberId}/active` | `ROLE_ADMIN`, `ROLE_STAFF`, or Own ID | Get active pass (BOLA-protected) |
| `POST` | `/api/subscriptions/{id}/renew` | `ROLE_ADMIN`, `ROLE_STAFF` | Extend subscription expiration |
| `DELETE` | `/api/subscriptions/{id}` | `ROLE_ADMIN`, `ROLE_STAFF` | Cancel / delete subscription |

### Attendance Service (`/api/attendance/**`)
| Method | Endpoint | Access Policy | Description |
|---|---|---|---|
| `GET` | `/api/attendance/recent` | `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_MEMBER` | List recent turnstile entries |
| `GET` | `/api/attendance/member/{memberId}` | `ROLE_ADMIN`, `ROLE_STAFF`, or Own ID | Get member attendance history (BOLA-protected) |
| `POST` | `/api/attendance/check-in` | `ROLE_ADMIN`, `ROLE_STAFF`, or Own ID | Turnstile check-in (Feign multi-verified) |
| `POST` | `/api/attendance/check-out` | `ROLE_ADMIN`, `ROLE_STAFF`, or Own ID | Turnstile exit timestamp record |
| `GET` | `/api/attendance/ai/fraud-alerts` | `ROLE_ADMIN`, `ROLE_STAFF` | Anomaly / pass-sharing alert detection |

---

## 13. Authentication & Authorization Flow

```
1. Client sends credentials: POST /api/auth/login
2. Auth Service authenticates with BCrypt -> Generates HS256 JWT
   Token Claims: { sub: "member_alex", role: "ROLE_MEMBER", memberId: 1, exp: ... }
3. Client sends request with header: Authorization: Bearer <token>
4. API Gateway:
   - Validates JWT signature and expiration
   - Strips client-supplied identity headers (anti-spoofing)
   - Routes to downstream service via Eureka (lb://)
5. Downstream Microservice:
   - JwtAuthenticationFilter independently verifies JWT signature
   - Builds UserPrincipal(username, role, memberId) in SecurityContextHolder
   - Evaluates method-level @PreAuthorize rules
6. Endpoint executes and returns response
```

---

## 14. RBAC & BOLA / IDOR Protection

### Role-Based Access Control (RBAC)
Configured using Spring Security's `@EnableMethodSecurity(prePostEnabled = true)`.
- If an unauthorized role invokes an endpoint (e.g., `member_alex` calling `DELETE /api/members/1`), Spring Security throws `AccessDeniedException` and returns **HTTP 403 Forbidden**.
- If a client attempts to forge `X-User-Role: ROLE_ADMIN`, API Gateway strips the header and the downstream service relies solely on the cryptographically signed JWT claim.

### Broken Object Level Authorization (BOLA/IDOR) Remediation
Implemented via `@Component("securityEvaluator")` and `@PreAuthorize("@securityEvaluator.canAccessMember(#memberId)")`:
- **`ROLE_ADMIN` & `ROLE_STAFF`:** Evaluator returns `true` (administrative oversight).
- **`ROLE_MEMBER`:** Evaluator verifies `targetMemberId.equals(principal.getMemberId())`.
  - Member 1 accessing Member 1 resources: **200 OK**.
  - Member 1 attempting to access Member 2 resources: **403 Forbidden**.
  - Unmapped member without a verified `memberId` claim: **403 Forbidden**.

---

## 15. OpenFeign Inter-Service Communication & Token Propagation

### Turnstile Multi-Service Verification
When a check-in is submitted (`POST /api/attendance/check-in`):
1. Attendance Service invokes `MemberServiceClient.getMemberById(memberId)` to confirm member exists and is `ACTIVE`.
2. Attendance Service invokes `SubscriptionServiceClient.getActiveSubscription(memberId)` to verify valid subscription for facility tier.
3. If both pass: `HTTP 200` with `granted: true`.
4. If subscription is expired or member is suspended: `HTTP 403` with `granted: false` and audit record inserted with denial reason.

### Token Propagation Mechanism
Both `attendance-service` and `subscription-service` include a `FeignClientInterceptor`:
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
This ensures downstream Feign REST calls carry the original caller's JWT Bearer token, satisfying downstream security filters without security bypasses.

---

## 16. CRUD Operations Quick Reference

### 1. Authenticate
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Member CRUD
```bash
# Create
curl -X POST http://localhost:8080/api/members \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john.doe@pulsefit.com","contact":"+1-555-0101","status":"ACTIVE"}'

# Read
curl -X GET http://localhost:8080/api/members/1 -H "Authorization: Bearer <TOKEN>"

# Update
curl -X PUT http://localhost:8080/api/members/1 \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"name":"John Doe Updated","email":"john.doe@pulsefit.com","contact":"+1-555-0199","status":"ACTIVE"}'

# Delete (ADMIN only)
curl -X DELETE http://localhost:8080/api/members/1 -H "Authorization: Bearer <TOKEN>"
```

### 3. Subscription CRUD
```bash
# Purchase Subscription (Feign validates member)
curl -X POST http://localhost:8080/api/subscriptions \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"memberId":1,"planId":1}'

# Read Active Subscription
curl -X GET http://localhost:8080/api/subscriptions/member/1/active -H "Authorization: Bearer <TOKEN>"

# Cancel Subscription
curl -X DELETE http://localhost:8080/api/subscriptions/1 -H "Authorization: Bearer <TOKEN>"
```

### 4. Turnstile Check-In
```bash
curl -X POST http://localhost:8080/api/attendance/check-in \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"memberId":1,"facilityId":"FACILITY_DOWNTOWN","facilityName":"Downtown Elite"}'
```

---

## 17. Runtime Load Balancing Verification

Verify round-robin load distribution across Member Service instances on ports 8082 and 8085:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\verify-load-balancing.ps1 -RequestCount 20
```

### Sample Output
```
Total Requests Sent : 20
Successful Requests : 20
Failed Requests     : 0

Instance Distribution:
  Instance 1 (Port 8082) : 10 requests (50%)
  Instance 2 (Port 8085) : 10 requests (50%)

[SUCCESS] Runtime Load Balancing Verified!
```

---

## 18. Automated Testing Instructions

Execute the complete multi-module Maven test suite:

```powershell
mvn test -pl eureka-server,api-gateway,auth-service,member-service,subscription-service,attendance-service -am
```

### Build Result
- **Eureka Server:** 1 test passed
- **API Gateway:** 9 tests passed
- **Auth Service:** 22 tests passed
- **Member Service:** 44 tests passed
- **Subscription Service:** 72 tests passed
- **Attendance Service:** 22 tests passed
- **Total:** **170 tests, 0 failures, 0 errors, 0 skipped.**
- **Build Status:** **BUILD SUCCESS**

---

## 19. PowerShell Verification Suite

All scripts are located in the `scripts/` directory and run through the API Gateway (`:8080`):

| Script | Purpose | Tests Executed | Expected Result |
|---|---|:---:|:---:|
| `verify-load-balancing.ps1` | Runtime round-robin load balancing & port tracking | 20 requests | 50% on 8082, 50% on 8085 |
| `test-crud-operations.ps1` | Full Member and Subscription CRUD with Feign calls | 5 operations | All operations succeed |
| `verify-downstream-jwt.ps1` | Direct downstream JWT enforcement without Gateway | 4 checks | HTTP 401 on direct access |
| `verify-rbac.ps1` | Fine-grained RBAC matrix and header spoofing resistance | 26 checks | Unauthorized access returns 403 |
| `verify-object-ownership.ps1` | BOLA/IDOR cross-member access denial | 32 checks | Cross-member access returns 403 |
| `verify-full-system.ps1` | Full 7-step member-to-turnstile lifecycle verification | 35 checks | All integration checks pass |

Run any script via PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\<SCRIPT_NAME>.ps1
```

---

## 20. Development Demo Credentials

The following development seed accounts are pre-configured in `pulsefit_auth.users`:

| Username | Password | Role | Member ID Linkage | Primary Use Case |
|---|---|---|:---:|---|
| **`admin`** | `admin123` | `ROLE_ADMIN` | `NULL` | Full administrative control, member deletion, audit inspection |
| **`staff_john`** | `staff123` | `ROLE_STAFF` | `NULL` | Facility staff operations, plan management, turnstile audits |
| **`member_alex`** | `alex123` | `ROLE_MEMBER` | **`1`** | Primary gym member demonstration (Member ID: 1) |
| **`member_sarah`** | `sarah123` | `ROLE_MEMBER` | **`2`** | Secondary gym member demonstration (BOLA target, Member ID: 2) |
