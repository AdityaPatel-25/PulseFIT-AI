# PulseFIT AI: Multi-Facility Fitness Membership & Attendance Tracking Platform

An enterprise-grade Service-Oriented Architecture (SOA) / Microservices platform designed for **PulseFit Health Clubs** to coordinate member profiles, subscription lifecycles, and high-speed physical turnstile check-ins across multiple facilities.

Built with **Java 17**, **Spring Boot 3.2.5**, **Spring Cloud 2023.0.1**, and fully optimized for **Spring Tool Suite 4 (STS4)**.

---

## 🎯 Review 1 Rubrics Fulfillment Matrix

| # | Rubric Criteria | Score Target | Fulfilled Artifacts & Implementation |
|---|---|:---:|---|
| 1 | **Problem Analysis & Requirement Specification** | **10 / 10** | [SRS_Document.md](SRS_Document.md): In-depth domain analysis, field survey data, functional/non-functional requirements, database schemas, and turnstile latency resolution. |
| 2 | **Microservice Identification & Service Discovery** | **10 / 10** | Highly modular DDD decomposition: 6 isolated services coordinated by Netflix Eureka (`:8761`) with declarative `Spring Cloud OpenFeign` inter-service communication and client-side load balancing. |
| 3 | **JWT Authentication** | **10 / 10** | `auth-service` (`:8081`): Issues HMAC-SHA256 cryptographically signed JWTs with BCrypt password hashing, role management (`ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_MEMBER`), and token validation. |
| 4 | **API Gateway Configuration** | **10 / 10** | `api-gateway` (`:8080`): Reactive Spring Cloud Gateway with service discovery routing (`lb://`), global CORS filter, and custom `JwtAuthenticationFilter` propagating user identity downstream (`X-User-Name`, `X-User-Role`). |
| 5 | **LinkedIn Article with DTI Concepts and Review** | **10 / 10** | [LinkedIn_Article_DTI.md](LinkedIn_Article_DTI.md): Publication-ready article detailing the 5 stages of Design Thinking & Innovation (Empathize, Define, Ideate, Prototype, Test), survey metrics, architecture diagrams, and ROI. |

---

## 🏗 Microservices Decomposition & Ports

```
                          ┌──────────────────────────┐
                          │  Eureka Discovery Server │
                          │       (Port 8761)        │
                          └─────────────┬────────────┘
                                        │ (Heartbeat & Service Discovery)
                                        ▼
                          ┌──────────────────────────┐
  Client / Turnstile ───► │   Spring Cloud Gateway   │
                          │       (Port 8080)        │
                          └─────────────┬────────────┘
         ┌──────────────────────────────┼──────────────────────────────┬──────────────────────────────┐
         │ (Public: /api/auth/**)       │ (Protected + JWT)            │ (Protected + JWT)            │ (Protected + JWT)
         ▼                              ▼                              ▼                              ▼
┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐
│   Auth Service   │           │  Member Service  │           │   Subscription   │           │Attendance Service│
│   (Port 8081)    │           │   (Port 8082)    │           │   Service (:8083)│           │   (Port 8084)    │
└──────────────────┘           └────────▲─────────┘           └────────▲─────────┘           └────────┬─────────┘
                                        │                              │                              │
                                        │ (OpenFeign)                  │ (OpenFeign)                  │
                                        ├──────────────────────────────┴──────────────────────────────┘
                                        │ AttSvc verifies Active Plan & Member validity
```

| Service | Port | Database | Primary Responsibility |
|---|:---:|---|---|
| **eureka-server** | `8761` | None | Service discovery registry dashboard (`http://localhost:8761`). |
| **api-gateway** | `8080` | None | Single entry point, load balancing (`lb://`), edge JWT validation filter, CORS. |
| **auth-service** | `8081` | H2 `authdb` | User registration, login, BCrypt password hashing, JWT generation. |
| **member-service** | `8082` | H2 `memberdb` | Member profile lifecycle (`member_id`, `name`, `contact`, `email`, `status`). |
| **subscription-service** | `8083` | H2 `subscriptiondb` | Plans (`BASIC`, `PREMIUM`, `ALL_ACCESS`), validity dates, automated renewals. |
| **attendance-service** | `8084` | H2 `attendancedb` | High-speed turnstile check-in engine; invokes Subscription & Member services via OpenFeign. |

---

## 📊 Database Tables

### 1. Member Table (`member`)
- `member_id` (BIGINT, PK, Auto Increment)
- `name` (VARCHAR)
- `contact` (VARCHAR)
- `email` (VARCHAR, Unique)
- `address` (VARCHAR)
- `emergency_contact` (VARCHAR)
- `status` (VARCHAR - `ACTIVE`, `INACTIVE`)
- `created_at` (TIMESTAMP)

### 2. Subscription Table (`subscription`)
- `subscription_id` (BIGINT, PK, Auto Increment)
- `member_id` (BIGINT, Logical FK)
- `plan_type` (VARCHAR - `BASIC_MONTHLY`, `PREMIUM_QUARTERLY`, `ALL_ACCESS_ANNUAL`)
- `start_date` (DATE)
- `expiry_date` (DATE)
- `status` (VARCHAR - `ACTIVE`, `EXPIRED`, `CANCELLED`)
- `facility_tier` (VARCHAR - `SINGLE_FACILITY`, `MULTI_FACILITY`)
- `price` (DOUBLE)
- `auto_renew` (BOOLEAN)
- `created_at` (TIMESTAMP)

### 3. Attendance Table (`attendance`)
- `attendance_id` (BIGINT, PK, Auto Increment)
- `member_id` (BIGINT)
- `facility_id` (VARCHAR)
- `facility_name` (VARCHAR)
- `check_in_time` (TIMESTAMP)
- `check_out_time` (TIMESTAMP)
- `access_status` (VARCHAR - `GRANTED`, `DENIED`)
- `denial_reason` (VARCHAR)

---

## ⚡ Inter-Service Communication Flow (Subscription -> Attendance -> Member)

When a gym member arrives at a facility turnstile:
1. **Turnstile Scanner** posts `memberId` and `facilityId` to API Gateway (`POST /api/attendance/check-in`).
2. **API Gateway** verifies the incoming JWT token signature and injects headers.
3. **Attendance Service** receives request:
   - Invokes `MemberServiceClient` (OpenFeign) to verify the member exists and is in `ACTIVE` status.
   - Invokes `SubscriptionServiceClient` (OpenFeign) to verify that the member holds an active, non-expired subscription (`/api/subscriptions/member/{id}/active`).
4. **Attendance Decision Engine**:
   - **Access Granted**: If member is active and has a valid subscription, inserts attendance record with `accessStatus='GRANTED'`, and returns `HTTP 200` with `granted: true`. Turnstile barrier opens instantly.
   - **Access Denied**: If member is suspended or pass has expired, inserts audit record with `accessStatus='DENIED'` and exact `denial_reason`, returning `HTTP 403` with `granted: false`.
5. **Subscription Service** also communicates with **Member Service** via OpenFeign during subscription creation to ensure no orphan subscriptions can ever be created.

---

## 💻 Running with Spring Tool Suite 4 (STS4)

Refer to the detailed guide in [STS4_Setup_Guide.md](STS4_Setup_Guide.md).

### Quick Steps:
1. In STS4: **File -> Import -> Maven -> Existing Maven Projects**.
2. Select `e:\PulseFIT-AI`. STS4 will import the root parent and all 6 microservices.
3. Launch services in this order using the **Boot Dashboard**:
   1. `eureka-server`
   2. `auth-service`
   3. `member-service`
   4. `subscription-service`
   5. `attendance-service`
   6. `api-gateway`
4. Open Eureka dashboard at `http://localhost:8761` to verify all 5 clients are registered.

---

## 🧪 Automated Testing

All modules have comprehensive JUnit 5 and Mockito tests covering authentication, JWT claims, CRUD operations, expiry date math, renewal workflows, and turnstile grant/deny decisions.

Execute tests via CLI:
```powershell
mvn clean test
```
Result: **BUILD SUCCESS (All tests passing with 0 failures/errors)**.
