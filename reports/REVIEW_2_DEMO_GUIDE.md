# PulseFIT AI — Review-2 Demonstration Guide

**Project:** `E:\PulseFIT-AI`  
**Target Duration:** 10–15 Minutes  
**Target Audience:** University Evaluators, Technical Reviewers, Architecture Assessors  
**Presenter Role:** Senior Spring Boot & Spring Cloud Microservices Engineer  

---

## Demonstration Quick Reference

| Demo Identity | Username | Password | Role | Member ID |
|---|---|---|---|:---:|
| **Administrator** | `admin` | `admin123` | `ROLE_ADMIN` | `NULL` |
| **Facility Staff** | `staff_john` | `staff123` | `ROLE_STAFF` | `NULL` |
| **Member 1** | `member_alex` | `alex123` | `ROLE_MEMBER` | **1** |
| **Member 2** | `member_sarah` | `sarah123` | `ROLE_MEMBER` | **2** |

### URLs & Ports
- **Eureka Registry Dashboard:** `http://localhost:8761`
- **Central API Gateway:** `http://localhost:8080`
- **Auth Service:** `http://localhost:8081`
- **Member Service 1 / 2:** `http://localhost:8082` / `http://localhost:8085`
- **Subscription Service:** `http://localhost:8083`
- **Attendance Service:** `http://localhost:8084`

---

## 10–15 Minute Demonstration Sequence

```
Step 1: Architecture Walkthrough (1 min)
  │
Step 2: Eureka Discovery & Multi-Instance Registry (1 min)
  │
Step 3: User Authentication & Signed JWT Issuance (1.5 min)
  │
Step 4: Edge Gateway & Downstream JWT Enforcement (1 min)
  │
Step 5: Role-Based Access Control - RBAC (1.5 min)
  │
Step 6: Object-Level Authorization - BOLA/IDOR Prevention (2 min)
  │
Step 7: Member Profile CRUD Operations (1.5 min)
  │
Step 8: Subscription & Plan Lifecycle CRUD (1.5 min)
  │
Step 9: Real-Time Physical Turnstile Entry & Exit (1.5 min)
  │
Step 10: Multi-Service Feign Verification & Denial Logic (1 min)
  │
Step 11: Member Service Round-Robin Load Balancing (1.5 min)
  │
Step 12: Automated Test Execution & Full Integration Proof (1 min)
```

---

### Step 1: Explain Microservice Architecture & Domain Separation

- **Objective:** Establish the business context, domain decomposition, and multi-facility problem solved by the platform.
- **Action:** Present the architecture diagram (from README or presentation slide).
- **What to Explain to the Evaluator:**
  > *"PulseFIT AI is an enterprise-grade fitness management platform engineered with Spring Boot 3.2.5 and Spring Cloud 2023.0.1. Instead of a monolithic architecture that bottlenecks under physical turnstile check-in spikes, the domain is decomposed into independent microservices: Auth Service handles security, Member Service manages profiles, Subscription Service handles billing cycles, and Attendance Service powers sub-second physical turnstile decisions. Each service maintains its own isolated MySQL 8.0 schema, and inter-service coordination is handled via Netflix Eureka and Spring Cloud OpenFeign."*

---

### Step 2: Show Eureka Service Registration

- **Objective:** Prove dynamic service discovery and multi-instance registration.
- **Action:** Open a browser and navigate to `http://localhost:8761`.
- **Expected Visual Display:**
  Under **Instances currently registered with Eureka**, confirm the presence of:
  - `API-GATEWAY` (1 instance: `api-gateway:8080`)
  - `AUTH-SERVICE` (1 instance: `auth-service:8081`)
  - `MEMBER-SERVICE` (**2 instances: `member-service:8082` and `member-service:8085`**)
  - `SUBSCRIPTION-SERVICE` (1 instance: `subscription-service:8083`)
  - `ATTENDANCE-SERVICE` (1 instance: `attendance-service:8084`)
- **What to Explain to the Evaluator:**
  > *"Here on the Eureka dashboard, all microservices have automatically registered. Notice that `MEMBER-SERVICE` has two active instances registered on ports 8082 and 8085 under the same application name. This provides zero-downtime redundancy and enables client-side round-robin load balancing through Spring Cloud Gateway."*

---

### Step 3: Demonstrate User Login and JWT Authentication

- **Objective:** Demonstrate authentication, BCrypt validation, and cryptographically signed JWT issuance.
- **Command (PowerShell):**
  ```powershell
  # 1. Login as Admin
  $adminLogin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post `
    -Body '{"username":"admin","password":"admin123"}' -ContentType "application/json"
  $adminToken = $adminLogin.token
  Write-Host "Admin JWT acquired. Length: $($adminToken.Length)"

  # 2. Login as Member Alex (Member ID 1)
  $alexLogin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post `
    -Body '{"username":"member_alex","password":"alex123"}' -ContentType "application/json"
  $alexToken = $alexLogin.token
  Write-Host "Alex JWT acquired. Role: $($alexLogin.role), Member ID: $($alexLogin.memberId)"
  ```
- **Expected Response:**
  - HTTP `200 OK`
  - JSON payload containing `token`, `username`, `role: "ROLE_ADMIN"` or `"ROLE_MEMBER"`, and verified `memberId`.
- **What to Explain to the Evaluator:**
  > *"Our Auth Service verifies credentials against BCrypt salted hashes stored in `pulsefit_auth.users`. Upon successful authentication, it generates a signed HMAC-SHA256 JWT. Crucially, when a member authenticates, the Auth Service embeds their verified database `memberId` as a signed claim inside the token payload. This claim forms the cryptographic foundation of our object-level ownership model."*

---

### Step 4: Demonstrate Protected Endpoints (401 Enforcement)

- **Objective:** Prove that unauthenticated requests cannot access protected business resources.
- **Command (PowerShell):**
  ```powershell
  # Attempt to access Member profiles without a token
  try {
      Invoke-WebRequest -Uri "http://localhost:8080/api/members" -UseBasicParsing
  } catch {
      Write-Host "Gateway Response: HTTP $($_.Exception.Response.StatusCode)"
  }
  ```
- **Expected Response:**
  - HTTP `401 Unauthorized`
- **What to Explain to the Evaluator:**
  > *"Spring Cloud Gateway applies our custom `JwtAuthenticationFilter` to all protected routes (`/api/members/**`, `/api/subscriptions/**`, `/api/plans/**`, `/api/attendance/**`). When no Bearer token or an invalid token is provided, the Gateway rejects the request immediately with HTTP 401 Unauthorized. Furthermore, even if an attacker bypasses the gateway and calls a downstream service directly on port 8082, the downstream service independently validates the JWT and returns 401 as well."*

---

### Step 5: Show Role-Based Access Control (RBAC)

- **Objective:** Demonstrate that permissions are strictly differentiated between `ROLE_ADMIN`, `ROLE_STAFF`, and `ROLE_MEMBER`.
- **Command (PowerShell):**
  ```powershell
  # Member Alex attempts to list all auth user accounts (Admin-only endpoint)
  try {
      Invoke-WebRequest -Uri "http://localhost:8080/api/auth/users" `
        -Headers @{ "Authorization" = "Bearer $alexToken" } -UseBasicParsing
  } catch {
      Write-Host "Member Alex accessing /api/auth/users: HTTP $($_.Exception.Response.StatusCode) Forbidden"
  }

  # Admin accesses the same endpoint
  $users = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/users" `
    -Headers @{ "Authorization" = "Bearer $adminToken" }
  Write-Host "Admin accessing /api/auth/users: HTTP 200 OK ($($users.Count) users retrieved)"
  ```
- **Expected Response:**
  - Member caller: HTTP `403 Forbidden`
  - Admin caller: HTTP `200 OK` (User list returned with password hashes stripped)
- **What to Explain to the Evaluator:**
  > *"We enforce fine-grained Role-Based Access Control using Spring Security's `@PreAuthorize` annotation on controller methods. Here, `GET /api/auth/users` requires `hasRole('ADMIN')`. When Member Alex calls it, Spring Security detects the `ROLE_MEMBER` authority and returns HTTP 403 Forbidden. When Admin calls it, the request succeeds. Notice also that the response DTO completely excludes password hashes, preventing credential leakage."*

---

### Step 6: Demonstrate BOLA/IDOR Prevention (The Key Security Milestone)

- **Objective:** Prove that one authenticated member CANNOT access or tamper with another member's records.
- **Command (PowerShell):**
  ```powershell
  # 1. Login as Member Sarah (Member ID 2)
  $sarahLogin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post `
    -Body '{"username":"member_sarah","password":"sarah123"}' -ContentType "application/json"
  $sarahToken = $sarahLogin.token

  # 2. Member Alex (ID 1) accesses OWN profile (ID 1) -> EXPECT 200 OK
  $alexOwn = Invoke-RestMethod -Uri "http://localhost:8080/api/members/1" `
    -Headers @{ "Authorization" = "Bearer $alexToken" }
  Write-Host "[BOLA Test 1] Alex accessing Alex's profile (ID 1): HTTP 200 OK -> Name: $($alexOwn.name)"

  # 3. Member Alex (ID 1) attempts to access Sarah's profile (ID 2) -> EXPECT 403 FORBIDDEN
  try {
      Invoke-WebRequest -Uri "http://localhost:8080/api/members/2" `
        -Headers @{ "Authorization" = "Bearer $alexToken" } -UseBasicParsing
  } catch {
      Write-Host "[BOLA Test 2] Alex accessing Sarah's profile (ID 2): HTTP $($_.Exception.Response.StatusCode) FORBIDDEN (BOLA Blocked!)"
  }

  # 4. Member Alex (ID 1) attempts to view Sarah's active subscription -> EXPECT 403 FORBIDDEN
  try {
      Invoke-WebRequest -Uri "http://localhost:8080/api/subscriptions/member/2/active" `
        -Headers @{ "Authorization" = "Bearer $alexToken" } -UseBasicParsing
  } catch {
      Write-Host "[BOLA Test 3] Alex accessing Sarah's subscription: HTTP $($_.Exception.Response.StatusCode) FORBIDDEN (BOLA Blocked!)"
  }

  # 5. Member Sarah (ID 2) accesses OWN subscriptions -> EXPECT 200 OK
  $sarahSub = Invoke-RestMethod -Uri "http://localhost:8080/api/subscriptions/member/2" `
    -Headers @{ "Authorization" = "Bearer $sarahToken" }
  Write-Host "[BOLA Test 4] Sarah accessing Sarah's subscription: HTTP 200 OK -> Plan: $($sarahSub[0].planType)"
  ```
- **Expected Response:**
  - Own resource access: HTTP `200 OK`
  - Cross-member access: HTTP `403 Forbidden`
- **What to Explain to the Evaluator:**
  > *"This demonstrates our remediation of Broken Object Level Authorization (BOLA), the #1 vulnerability on the OWASP API Security Top 10. Previously, any authenticated member could supply any member ID in the URL. In Milestone 5A, we resolved this by binding the verified `memberId` into the signed JWT. Our `@securityEvaluator.canAccessMember(#memberId)` bean compares the URL parameter with the verified claim in the caller's SecurityContext. Member Alex can view Member 1, but when he tries to view Member 2, the request is immediately rejected with HTTP 403 Forbidden."*

---

### Step 7: Demonstrate Member CRUD Operations

- **Objective:** Demonstrate full Member profile lifecycle management.
- **Command (PowerShell):**
  ```powershell
  # Create a demo member (using Admin token)
  $newMember = @{
      name             = "Demo Evaluator"
      email            = "evaluator@pulsefit.ai"
      contact          = "+1-555-4321"
      address          = "University Tech Campus"
      emergencyContact = "+1-555-9876"
  } | ConvertTo-Json

  $created = Invoke-RestMethod -Uri "http://localhost:8080/api/members" -Method Post `
    -Headers @{ "Authorization" = "Bearer $adminToken" } -Body $newMember -ContentType "application/json"
  $demoMemberId = $created.memberId
  Write-Host "Created Member ID: $demoMemberId ($($created.name))"

  # Update the demo member
  $update = @{
      name             = "Demo Evaluator (Senior Reviewer)"
      email            = "evaluator@pulsefit.ai"
      contact          = "+1-555-4321"
      address          = "University Tech Campus, Building B"
      emergencyContact = "+1-555-9876"
  } | ConvertTo-Json

  $updated = Invoke-RestMethod -Uri "http://localhost:8080/api/members/$demoMemberId" -Method Put `
    -Headers @{ "Authorization" = "Bearer $adminToken" } -Body $update -ContentType "application/json"
  Write-Host "Updated Member Name to: $($updated.name)"
  ```
- **Expected Response:**
  - Create: HTTP `201 Created` with generated `memberId`.
  - Update: HTTP `200 OK` with modified attributes.
- **What to Explain to the Evaluator:**
  > *"Member profiles are managed through Member Service with standard validation (e.g., unique email, required contact numbers). When a member is created, an entity is persisted to `pulsefit_member.member`. Member creation and updates are restricted to Staff and Admin roles."*

---

### Step 8: Demonstrate Subscription & Plan CRUD

- **Objective:** Demonstrate membership plan management, automated subscription generation, and deletion.
- **Command (PowerShell):**
  ```powershell
  # 1. Retrieve available plans
  $plans = Invoke-RestMethod -Uri "http://localhost:8080/api/plans" `
    -Headers @{ "Authorization" = "Bearer $adminToken" }
  $planId = $plans[0].planId
  Write-Host "Selected Plan: $($plans[0].planName) (ID: $planId, Tier: $($plans[0].facilityTier))"

  # 2. Purchase subscription for the newly created demo member
  # (Subscription Service invokes Member Service via OpenFeign to verify member exists!)
  $subBody = @{
      memberId = $demoMemberId
      planId   = $planId
  } | ConvertTo-Json

  $sub = Invoke-RestMethod -Uri "http://localhost:8080/api/subscriptions" -Method Post `
    -Headers @{ "Authorization" = "Bearer $adminToken" } -Body $subBody -ContentType "application/json"
  $demoSubId = $sub.subscriptionId
  Write-Host "Created Subscription ID: $demoSubId (Status: $($sub.status), Expires: $($sub.expiryDate))"
  ```
- **Expected Response:**
  - Plans: HTTP `200 OK`
  - Subscription Creation: HTTP `201 Created` with computed start date and expiry date.
- **What to Explain to the Evaluator:**
  > *"When `POST /api/subscriptions` is invoked, Subscription Service does not simply insert a record blindly. It invokes Member Service via OpenFeign to verify that member exists. If valid, it computes the expiration date based on the plan duration and inserts the record into `pulsefit_subscription`. In Milestone 2, we also implemented DELETE `/api/subscriptions/{id}` for subscription cancellations."*

---

### Step 9: Demonstrate Real-Time Turnstile Entry & Exit

- **Objective:** Demonstrate high-speed physical turnstile entry validation and exit recording.
- **Command (PowerShell):**
  ```powershell
  # Turnstile Check-in for Demo Member
  $checkInBody = @{
      memberId     = $demoMemberId
      facilityId   = "FACILITY_DOWNTOWN"
      facilityName = "PulseFit Downtown Elite"
  } | ConvertTo-Json

  $checkIn = Invoke-RestMethod -Uri "http://localhost:8080/api/attendance/check-in" -Method Post `
    -Headers @{ "Authorization" = "Bearer $adminToken" } -Body $checkInBody -ContentType "application/json"
  Write-Host "Turnstile Scan Result: Granted = $($checkIn.granted), Message: $($checkIn.message)"

  # Turnstile Check-out
  $checkOutBody = @{
      memberId   = $demoMemberId
      facilityId = "FACILITY_DOWNTOWN"
  } | ConvertTo-Json

  $checkOut = Invoke-RestMethod -Uri "http://localhost:8080/api/attendance/check-out" -Method Post `
    -Headers @{ "Authorization" = "Bearer $adminToken" } -Body $checkOutBody -ContentType "application/json"
  Write-Host "Turnstile Exit Recorded: Status = $($checkOut.status), Message: $($checkOut.message)"
  ```
- **Expected Response:**
  - Check-in: HTTP `200 OK` with `granted: true`, `accessStatus: "GRANTED"`.
  - Check-out: HTTP `200 OK` with checkout timestamp recorded.
- **What to Explain to the Evaluator:**
  > *"At the turnstile scanner, the barrier controller sends a check-in request. Attendance Service coordinates with Member Service (verifying active membership) and Subscription Service (verifying an unexpired pass for this facility). If both pass, it instantly grants entry (`granted: true`) and records the check-in timestamp in `pulsefit_attendance.attendance`."*

---

### Step 10: Show Feign-Based Denial Logic & Cleanup

- **Objective:** Prove negative validation when a member has NO active subscription.
- **Command (PowerShell):**
  ```powershell
  # 1. Cancel the demo member's subscription
  Invoke-RestMethod -Uri "http://localhost:8080/api/subscriptions/$demoSubId" -Method Delete `
    -Headers @{ "Authorization" = "Bearer $adminToken" }
  Write-Host "Subscription $demoSubId cancelled."

  # 2. Attempt check-in again (Should be DENIED)
  $deniedScan = Invoke-RestMethod -Uri "http://localhost:8080/api/attendance/check-in" -Method Post `
    -Headers @{ "Authorization" = "Bearer $adminToken" } -Body $checkInBody -ContentType "application/json"
  Write-Host "Turnstile Scan (After Cancellation): Granted = $($deniedScan.granted), Reason: $($deniedScan.denialReason)"

  # 3. Clean up the demo member record
  Invoke-RestMethod -Uri "http://localhost:8080/api/members/$demoMemberId" -Method Delete `
    -Headers @{ "Authorization" = "Bearer $adminToken" }
  Write-Host "Demo member $demoMemberId cleaned up."
  ```
- **Expected Response:**
  - Turnstile Scan: HTTP `200 OK` with `granted: false`, `accessStatus: "DENIED"`, `denialReason: "No active subscription found for member"`.
- **What to Explain to the Evaluator:**
  > *"Here we demonstrate our negative security workflow. The moment a subscription is deleted or expires, the turnstile scanner queries Attendance Service, which queries Subscription Service via Feign. Finding no active pass, the turnstile immediately denies entry (`granted: false`) and logs an audit record with the exact denial reason."*

---

### Step 11: Demonstrate Load Balancing Across Ports 8082 and 8085

- **Objective:** Prove demonstrable round-robin client-side load balancing through API Gateway.
- **Command (PowerShell):**
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts\verify-load-balancing.ps1 -RequestCount 20
  ```
- **Expected Console Output:**
  ```
  Total Requests Sent : 20
  Successful Requests : 20
  Failed Requests     : 0

  Instance Distribution:
    Instance 1 (Port 8082) : 10 requests (50%)
    Instance 2 (Port 8085) : 10 requests (50%)

  [SUCCESS] Runtime Load Balancing Verified!
  ```
- **What to Explain to the Evaluator:**
  > *"For Review-2, we implemented demonstrable load balancing. We run two instances of Member Service: Instance 1 on port 8082 and Instance 2 on port 8085. Both register with Eureka as `MEMBER-SERVICE`. When the API Gateway routes requests to `lb://MEMBER-SERVICE`, Spring Cloud LoadBalancer distributes incoming requests using a round-robin algorithm. Each instance injects an `X-Handled-By-Port` response header, proving that traffic alternates evenly (50% on :8082, 50% on :8085)."*

---

### Step 12: Show Automated Test Results & Integration Suite

- **Objective:** Provide automated verification proof of system stability and test coverage.
- **Command (PowerShell):**
  ```powershell
  # Run the full integration verification suite
  powershell -ExecutionPolicy Bypass -File scripts\verify-full-system.ps1
  ```
- **Expected Console Output:**
  ```
  ======================================================================
   Full-System Integration Verification Summary
  ======================================================================
  Total Passed: 35
  Total Failed: 0

  >>> MILESTONE 5 FULL-SYSTEM INTEGRATION VERIFICATION SUCCESSFUL <<<
  ```
- **What to Explain to the Evaluator:**
  > *"Finally, we demonstrate our automated testing rigor. Our codebase has 170 unit and integration tests across 15 test classes in all 6 modules, with zero failures. In addition, our automated PowerShell integration suite exercises 35 live multi-service assertions through the API Gateway, confirming service discovery, downstream JWT validation, RBAC, BOLA remediation, and load balancing are 100% operational."*

---

## Demonstration Checklist

- [ ] Eureka Server running on `:8761`
- [ ] API Gateway running on `:8080`
- [ ] Auth Service running on `:8081`
- [ ] Member Service Instance 1 running on `:8082`
- [ ] Member Service Instance 2 running on `:8085`
- [ ] Subscription Service running on `:8083`
- [ ] Attendance Service running on `:8084`
- [ ] MySQL 8.0 running on `:3306` with all 4 schemas
- [ ] PowerShell terminal open in `E:\PulseFIT-AI`
- [ ] Chrome / browser tab open to `http://localhost:8761`
