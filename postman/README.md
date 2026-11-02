# 🚀 PulseFIT AI - Postman API Gateway Testing Guide

This guide walks you through testing all PulseFIT AI backend microservices through the **Spring Cloud API Gateway (`http://localhost:8080`)** using Postman.

---

## 📂 Included Postman Files

| File | Purpose |
|------|---------|
| [`PulseFIT_API_Gateway.postman_collection.json`](file:///e:/PulseFIT-AI/postman/PulseFIT_API_Gateway.postman_collection.json) | Complete collection of requests for Auth, Member, Subscription, and Attendance microservices. |
| [`PulseFIT_Local_Environment.postman_environment.json`](file:///e:/PulseFIT-AI/postman/PulseFIT_Local_Environment.postman_environment.json) | Environment file with `base_url` set to `http://localhost:8080` and dynamic `jwt_token`. |

---

## 🛠️ Step-by-Step Instructions

### 1. Import Files into Postman
1. Open **Postman**.
2. Click the **Import** button in the top left.
3. Drag & drop or select both files:
   - `PulseFIT_API_Gateway.postman_collection.json`
   - `PulseFIT_Local_Environment.postman_environment.json`
4. In the top right environment dropdown, select **PulseFIT Local Environment**.

---

### 2. Authentication Flow (Automatic Token Extraction)
1. In the collection, navigate to:
   `1. Authentication (Auth Service)` ➡️ **`Login as Admin (Extracts JWT)`**
2. Click **Send**.
3. **Response**: HTTP 200 with `token`, `username`, and `roles`.
4. *Postman automatically stores the Bearer JWT token into the `jwt_token` environment variable!*

> **Alternative Logins Available**:
> - `Login as Staff (staff_john)` / `staff123`
> - `Login as Member (member_alex)` / `member123`

---

### 3. Test Microservices via Gateway

All subsequent requests automatically inherit the `{{jwt_token}}` variable:

#### 👥 Member Service (`/api/members/**`)
- **Get All Members**: `GET {{base_url}}/api/members`
- **Get Member by ID (1)**: `GET {{base_url}}/api/members/1`
- **Register New Member**: `POST {{base_url}}/api/members`

#### 💳 Subscription Service (`/api/subscriptions/**`)
- **Get All Subscriptions**: `GET {{base_url}}/api/subscriptions`
- **Get Subscriptions for Member 1**: `GET {{base_url}}/api/subscriptions/member/1`
- **Create Subscription**: `POST {{base_url}}/api/subscriptions`
- **Cancel/Delete Subscription**: `DELETE {{base_url}}/api/subscriptions/1`

#### ⚡ Attendance & Turnstile Service (`/api/attendance/**`)
- **Get Turnstile Access History**: `GET {{base_url}}/api/attendance/recent`
- **Simulate Turnstile Badge Scan (Downtown Elite)**: `POST {{base_url}}/api/attendance/verify`
  ```json
  {
    "memberId": 1,
    "facilityId": "FAC-DOWNTOWN-01",
    "accessGate": "Turnstile Gate #1"
  }
  ```

---

## 🌐 Port Architecture Summary

| Service | Port | Direct URL | Via Gateway (:8080) |
|---|---|---|---|
| **API Gateway** | `8080` | `http://localhost:8080` | Entry Point |
| **Eureka Server** | `8761` | `http://localhost:8761` | Service Registry |
| **Auth Service** | `8081` | `http://localhost:8081` | `http://localhost:8080/api/auth/**` |
| **Member Service** | `8082` | `http://localhost:8082` | `http://localhost:8080/api/members/**` |
| **Subscription Service** | `8083` | `http://localhost:8083` | `http://localhost:8080/api/subscriptions/**` |
| **Attendance Service** | `8084` | `http://localhost:8084` | `http://localhost:8080/api/attendance/**` |
| **Frontend Web App** | `3000` | `http://localhost:3000` | Browser Client |
