# 🚀 PulseFIT AI — Quick Setup Guide for Friends & Teammates

Welcome to **PulseFIT AI**! Follow the steps below to run and explore the platform on your computer.

---

## ⚡ Option 1: Instant Preview (0 Installs Required — 5 Seconds)

If you just want to immediately see the frontend interface, dashboard, and interactive turnstile animations without installing Java or MySQL:

1. Locate the file **`index.html`** in this project folder.
2. Double-click it to open it in **Google Chrome**, **Microsoft Edge**, or any browser.
3. You can explore the full interactive dashboard immediately!

---

## 🛠 Option 2: Run Full Platform (Microservices + React Frontend + MySQL)

### 1. Prerequisites Checklist
Ensure you have the following installed on your system:
- **Java 17 (or higher)**: Check with `java -version`
- **Apache Maven 3.8+**: Check with `mvn -version`
- **Node.js 18+ & npm**: Check with `node -v`
- **MySQL 8.0**: Running on default port `3306` with username `root` and password `root`  
  *(If your MySQL password is not `root`, see Section 4 below).*

---

### 2. First-Time Setup (Install Frontend Dependencies)

Before starting the frontend for the first time, open PowerShell in the project folder and run:

```powershell
cd frontend
npm install
cd ..
```

---

### 3. Start All Services (1-Click)

Simply double-click:
```
start-full-platform.bat
```
*(Or in PowerShell run: `.\run-all.ps1 -WithFrontend`)*

This script automatically opens individual windows and boots:
1. **Eureka Discovery Server** (`http://localhost:8761`)
2. **Auth Service** (`http://localhost:8081`)
3. **Member Service** (`http://localhost:8082`)
4. **Subscription Service** (`http://localhost:8083`)
5. **Attendance Service** (`http://localhost:8084`)
6. **API Gateway** (`http://localhost:8080`)
7. **React Web Application** (`http://localhost:3000`)

---

### 4. How to Change MySQL Password (If Not "root")

If your local MySQL root user has a different password (e.g. `mypassword`), simply open the `application.yml` file in these 4 folders:
- `auth-service/src/main/resources/application.yml`
- `member-service/src/main/resources/application.yml`
- `subscription-service/src/main/resources/application.yml`
- `attendance-service/src/main/resources/application.yml`

Change `password: root` to `password: your_password`.

---

### 5. Login Credentials for Testing

| Role | Username / Email | Password |
|---|---|---|
| **Admin** | `admin` *(or `admin@pulsefit.com`)* | `admin123` |
| **Staff** | `staff_john` *(or `staff@pulsefit.com`)* | `staff123` |
| **Member** | `member_alex` *(or `alex@pulsefit.com`)* | `alex123` |

> [!TIP]
> - You can also click the **Google** or **GitHub** buttons on the login screen for instant OAuth sign-in!
> - Click **Open Security & Database Validation Page** to inspect live database tables, BCrypt password hashes, and JWT claims.
