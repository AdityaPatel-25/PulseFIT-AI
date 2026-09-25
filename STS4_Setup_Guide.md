# Spring Tool Suite 4 (STS4) & Java 17 - Setup & Execution Guide
## PulseFit Health Clubs - Multi-Facility Fitness Platform

This guide walks you through importing, running, and verifying the **PulseFIT AI** microservices suite in **Spring Tool Suite 4 (STS4)** using **Java 17**.

---

## 1. Prerequisites
- **JDK 17 or higher** installed and configured in your `JAVA_HOME` environment variable.
- **Spring Tool Suite 4 (STS4)** installed.
- (Optional) Apache Maven 3.9+ (STS4 includes embedded Maven).

---

## 2. Importing the Project into Spring Tool Suite 4 (STS4)

1. Open **Spring Tool Suite 4**.
2. Go to **File** -> **Import...**
3. Expand **Maven** and select **Existing Maven Projects**, then click **Next**.
4. In the **Root Directory** field, click **Browse...** and select the project folder:
   ```
   e:\PulseFIT-AI
   ```
5. STS4 will scan the repository and detect the root project and all 6 microservices:
   - `pom.xml` (com.pulsefit:pulsefit-parent)
   - `eureka-server/pom.xml` (com.pulsefit:eureka-server)
   - `auth-service/pom.xml` (com.pulsefit:auth-service)
   - `member-service/pom.xml` (com.pulsefit:member-service)
   - `subscription-service/pom.xml` (com.pulsefit:subscription-service)
   - `attendance-service/pom.xml` (com.pulsefit:attendance-service)
   - `api-gateway/pom.xml` (com.pulsefit:api-gateway)
6. Ensure all checkboxes are checked, then click **Finish**.
7. Allow STS4 a few moments to resolve Maven dependencies and build the workspace.

---

## 3. Recommended Startup Order in STS4 "Boot Dashboard"

STS4 provides a convenient **Boot Dashboard** view in the lower-left corner. Start the microservices in the following sequential order:

```
[Step 1] eureka-server          (Port 8761)  ── Service Discovery Registry
   │
[Step 2] auth-service           (Port 8081)  ── Authentication & JWT Issuer
   │
[Step 3] member-service         (Port 8082)  ── Member Profiles
   │
[Step 4] subscription-service   (Port 8083)  ── Plans & Expirations
   │
[Step 5] attendance-service     (Port 8084)  ── Turnstile Check-In Engine
   │
[Step 6] api-gateway            (Port 8080)  ── Single Ingress & Routing
```

### How to Start Each Service in STS4:
- In the **Boot Dashboard**, right-click the project (e.g., `eureka-server`) -> click **(Re)start**.
- Alternatively, right-click the Application class -> **Run As** -> **Spring Boot App**.

---

## 4. Verifying Services

### A. Eureka Dashboard
Open your web browser and navigate to:
```
http://localhost:8761
```
You will see the Netflix Eureka dashboard. Within 15-30 seconds, all microservices will appear under **Instances currently registered with Eureka**:
- `API-GATEWAY`
- `AUTH-SERVICE`
- `MEMBER-SERVICE`
- `SUBSCRIPTION-SERVICE`
- `ATTENDANCE-SERVICE`

### B. H2 Database Consoles (Embedded Zero-Config Data Stores)
Each service includes an embedded H2 database console:
- Auth Service DB: `http://localhost:8081/h2-console` (JDBC URL: `jdbc:h2:mem:authdb`)
- Member Service DB: `http://localhost:8082/h2-console` (JDBC URL: `jdbc:h2:mem:memberdb`)
- Subscription Service DB: `http://localhost:8083/h2-console` (JDBC URL: `jdbc:h2:mem:subscriptiondb`)
- Attendance Service DB: `http://localhost:8084/h2-console` (JDBC URL: `jdbc:h2:mem:attendancedb`)
*(Username: `sa`, Password: leave blank)*

### C. Swagger UI & JWT Bearer Authentication (Interactive OpenAPI 3)
- **⚡ Unified API Gateway Swagger Hub (All Microservices in One)**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
  *(Select any service from the top-right definition dropdown: Auth, Member, Subscription, or Attendance. All requests route directly through API Gateway Port 8080 with live JWT security!)*
- **Auth Service Swagger**: [http://localhost:8081/swagger-ui/index.html](http://localhost:8081/swagger-ui/index.html)
- **Member Service Swagger**: [http://localhost:8082/swagger-ui/index.html](http://localhost:8082/swagger-ui/index.html)
- **Subscription Service Swagger**: [http://localhost:8083/swagger-ui/index.html](http://localhost:8083/swagger-ui/index.html)
- **Attendance Service Swagger**: [http://localhost:8084/swagger-ui/index.html](http://localhost:8084/swagger-ui/index.html)
- **In-App Web Dashboard Swagger Portal**: [http://localhost:3000](http://localhost:3000) (Navigate to "Swagger UI" tab)

#### How to Authenticate with JWT in Swagger UI:
1. Open the **Auth Service Swagger UI**: `http://localhost:8081/swagger-ui/index.html`
2. Expand `POST /api/auth/login` ➡️ click **Try it out** ➡️ enter:
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
   Click **Execute** and copy the `"token"` value from the response.
3. Click the green **Authorize 🔓** button at the top right of the Swagger UI.
4. Paste the JWT token into the `Value` box and click **Authorize**, then **Close**.
5. The lock turns to closed 🔒. All secured endpoints (e.g. `GET /api/auth/validate`, `GET /api/members`) will now automatically send `Authorization: Bearer <token>`.

---

## 5. End-to-End Testing via Postman or cURL

### Step 1: Login to Obtain JWT Token
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```
**Sample Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "username": "admin",
  "role": "ROLE_ADMIN",
  "expiresIn": 86400000
}
```
*Save the returned `token` to pass in subsequent requests.*

---

### Step 2: Query All Members (via API Gateway)
```bash
curl -X GET http://localhost:8080/api/members \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```
**Sample Response:**
```json
[
  {
    "memberId": 1,
    "name": "Alex Mercer",
    "contact": "+1-555-0192",
    "email": "alex@pulsefit.com",
    "status": "ACTIVE"
  },
  {
    "memberId": 2,
    "name": "Sarah Connor",
    "contact": "+1-555-0144",
    "email": "sarah.connor@cyberdyne.org",
    "status": "ACTIVE"
  },
  {
    "memberId": 3,
    "name": "Marcus Vance",
    "contact": "+1-555-0177",
    "email": "marcus.v@fitnesshub.io",
    "status": "ACTIVE"
  }
]
```

---

### Step 3: Check Active Subscription for Member 1
```bash
curl -X GET http://localhost:8080/api/subscriptions/member/1/active \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```
**Sample Response:**
```json
{
  "subscriptionId": 1,
  "memberId": 1,
  "planType": "ALL_ACCESS_ANNUAL",
  "status": "ACTIVE",
  "currentlyValid": true
}
```

---

### Step 4: Turnstile Check-In (Access Granted Scenario)
Member 1 (Alex Mercer) swipes card at Downtown facility:
```bash
curl -X POST http://localhost:8080/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "memberId": 1,
    "facilityId": "FACILITY_DOWNTOWN",
    "facilityName": "PulseFit Downtown Elite"
  }'
```
**Expected Response (HTTP 200 OK):**
```json
{
  "granted": true,
  "memberId": 1,
  "memberName": "Alex Mercer",
  "facilityId": "FACILITY_DOWNTOWN",
  "facilityName": "PulseFit Downtown Elite",
  "attendanceId": 4,
  "message": "ACCESS GRANTED - Welcome to PulseFit Downtown Elite!",
  "timestamp": "2026-09-14T15:45:00"
}
```

---

### Step 5: Turnstile Check-In (Access Denied Scenario - Expired Pass)
Member 3 (Marcus Vance) swipes card with expired subscription:
```bash
curl -X POST http://localhost:8080/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "memberId": 3,
    "facilityId": "FACILITY_WESTSIDE",
    "facilityName": "PulseFit Westside Express"
  }'
```
**Expected Response (HTTP 403 FORBIDDEN):**
```json
{
  "granted": false,
  "memberId": 3,
  "memberName": "Marcus Vance",
  "facilityId": "FACILITY_WESTSIDE",
  "message": "ACCESS DENIED: No active membership subscription or pass has expired",
  "timestamp": "2026-09-14T15:46:00"
}
```

---

### Step 6: Renew Marcus Vance's Subscription
```bash
curl -X POST http://localhost:8080/api/subscriptions/3/renew \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "extensionMonths": 6,
    "updatedPlanType": "PREMIUM_SEMI_ANNUAL",
    "renewalPrice": 249.99
  }'
```
*After renewal, repeating Step 5 will immediately return **ACCESS GRANTED**.*

---

## 6. Running Unit & Integration Tests via Maven

To run tests from the command line or terminal inside STS4:
```powershell
mvn clean test
```
All unit and integration tests across Auth, Member, Subscription, Attendance, and Gateway modules will execute and report test passes.
