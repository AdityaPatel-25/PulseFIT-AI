package com.pulsefit.gateway.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
public class GatewayHomeController {

    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    public Mono<String> home() {
        String html = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>PulseFIT AI — API Gateway (:8080)</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --bg-main: #08090e;
                        --bg-card: rgba(14, 18, 27, 0.85);
                        --border-color: rgba(255, 255, 255, 0.08);
                        --accent-green: #10b981;
                        --accent-cyan: #06b6d4;
                        --accent-purple: #8b5cf6;
                        --text-main: #f1f5f9;
                        --text-muted: #94a3b8;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        background-color: var(--bg-main);
                        color: var(--text-main);
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 30px 20px;
                        background-image: radial-gradient(circle at 50% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 60%);
                    }
                    .container {
                        max-width: 960px;
                        width: 100%;
                        background: var(--bg-card);
                        border: 1px solid var(--border-color);
                        border-radius: 20px;
                        padding: 36px;
                        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(20px);
                    }
                    .header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        flex-wrap: wrap;
                        gap: 16px;
                        margin-bottom: 24px;
                        padding-bottom: 20px;
                        border-bottom: 1px solid var(--border-color);
                    }
                    .badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        padding: 4px 12px;
                        border-radius: 9999px;
                        font-size: 0.75rem;
                        font-weight: 700;
                        background: rgba(16, 185, 129, 0.15);
                        color: var(--accent-green);
                        border: 1px solid rgba(16, 185, 129, 0.3);
                    }
                    .dot {
                        width: 8px;
                        height: 8px;
                        background: var(--accent-green);
                        border-radius: 50%;
                        box-shadow: 0 0 8px var(--accent-green);
                    }
                    h1 {
                        font-size: 1.6rem;
                        font-weight: 800;
                        letter-spacing: -0.03em;
                    }
                    p.sub {
                        color: var(--text-muted);
                        font-size: 0.88rem;
                        line-height: 1.5;
                        margin-top: 4px;
                    }
                    .info-box {
                        background: rgba(6, 182, 212, 0.08);
                        border: 1px solid rgba(6, 182, 212, 0.25);
                        border-radius: 12px;
                        padding: 16px 20px;
                        font-size: 0.84rem;
                        color: #a5f3fc;
                        margin-bottom: 28px;
                        line-height: 1.5;
                    }
                    .section-title {
                        font-size: 0.95rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        color: var(--text-muted);
                        margin-bottom: 14px;
                    }
                    .grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 14px;
                        margin-bottom: 28px;
                    }
                    .card {
                        background: rgba(255, 255, 255, 0.02);
                        border: 1px solid var(--border-color);
                        border-radius: 14px;
                        padding: 18px;
                        text-decoration: none;
                        color: var(--text-main);
                        transition: all 0.2s ease;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }
                    .card:hover {
                        background: rgba(255, 255, 255, 0.05);
                        border-color: rgba(16, 185, 129, 0.4);
                        transform: translateY(-2px);
                    }
                    .card-highlight {
                        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%);
                        border-color: rgba(16, 185, 129, 0.4);
                    }
                    .card-highlight:hover {
                        border-color: var(--accent-green);
                        box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
                    }
                    .card-head {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 8px;
                    }
                    .card-title {
                        font-size: 0.95rem;
                        font-weight: 700;
                    }
                    .card-port {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 0.72rem;
                        padding: 2px 6px;
                        background: rgba(255, 255, 255, 0.06);
                        border-radius: 6px;
                        color: var(--text-muted);
                    }
                    .card-desc {
                        font-size: 0.78rem;
                        color: var(--text-muted);
                        line-height: 1.4;
                    }
                    .routes-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 0.8rem;
                        font-family: 'JetBrains Mono', monospace;
                    }
                    .routes-table th, .routes-table td {
                        padding: 10px 14px;
                        text-align: left;
                        border-bottom: 1px solid var(--border-color);
                    }
                    .routes-table th {
                        color: var(--text-muted);
                        font-size: 0.72rem;
                        text-transform: uppercase;
                    }
                    .method {
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-weight: 700;
                        font-size: 0.7rem;
                    }
                    .btn-launch {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        background: var(--accent-green);
                        color: #041f17;
                        font-weight: 700;
                        font-size: 0.88rem;
                        padding: 12px 24px;
                        border-radius: 10px;
                        text-decoration: none;
                        transition: all 0.2s;
                    }
                    .btn-launch:hover {
                        filter: brightness(1.15);
                        transform: scale(1.02);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div>
                            <h1>⚡ PulseFIT API Gateway Ingress</h1>
                            <p class="sub">Spring Cloud Gateway reverse proxy running on Port <strong>8080</strong></p>
                        </div>
                        <div class="badge">
                            <span class="dot"></span> GATEWAY 200 OK
                        </div>
                    </div>

                    <div class="info-box">
                        💡 <strong>Why are you seeing this page?</strong><br>
                        Port <strong>8080</strong> is the backend API Gateway router for incoming REST traffic (<code>/api/**</code>). It does not host a static web page by itself. To view the user interface or test endpoints, use the links below:
                    </div>

                    <div class="section-title">🚀 Launch User Applications</div>
                    <div class="grid">
                        <a href="http://localhost:3000" class="card card-highlight">
                            <div>
                                <div class="card-head">
                                    <span class="card-title" style="color: #34d399;">🖥️ Web Dashboard (React)</span>
                                    <span class="card-port">:3000</span>
                                </div>
                                <p class="card-desc">Interactive frontend with Turnstile Simulator, Member & Subscription Management, and In-App Swagger Explorer.</p>
                            </div>
                            <div style="margin-top: 14px; font-weight: 700; font-size: 0.8rem; color: #34d399;">
                                Open Dashboard ➔
                            </div>
                        </a>

                        <a href="http://localhost:8761" target="_blank" class="card">
                            <div>
                                <div class="card-head">
                                    <span class="card-title">🌐 Eureka Discovery Registry</span>
                                    <span class="card-port">:8761</span>
                                </div>
                                <p class="card-desc">Real-time Netflix Eureka cluster dashboard showing all 5 active registered microservices.</p>
                            </div>
                            <div style="margin-top: 14px; font-weight: 700; font-size: 0.8rem; color: var(--accent-cyan);">
                                View Registry ➔
                            </div>
                        </a>
                    </div>

                    <div class="section-title">📖 Interactive Swagger UI Testbenches</div>
                    <div class="grid" style="margin-bottom: 14px;">
                        <a href="http://localhost:8080/swagger-ui.html" target="_blank" class="card card-highlight" style="grid-column: 1 / -1; border-color: rgba(139, 92, 246, 0.5);">
                            <div>
                                <div class="card-head">
                                    <span class="card-title" style="color: #a78bfa; font-size: 1.05rem;">⚡ Unified API Gateway Swagger UI (Port 8080)</span>
                                    <span class="card-port" style="color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.4);">ALL SERVICES INGRESS</span>
                                </div>
                                <p class="card-desc" style="color: #e2e8f0;">
                                    Unified OpenAPI 3 testbench aggregating <strong>Auth</strong>, <strong>Member</strong>, <strong>Subscription</strong>, and <strong>Attendance</strong> services. All requests execute directly through the API Gateway (Port 8080) with live JWT authentication and route filtering.
                                </p>
                            </div>
                            <div style="margin-top: 14px; font-weight: 700; font-size: 0.85rem; color: #a78bfa;">
                                Open Gateway Unified Swagger UI (Port 8080) ➔
                            </div>
                        </a>
                    </div>
                    <div class="grid">
                        <a href="http://localhost:8081/swagger-ui/index.html" target="_blank" class="card">
                            <div>
                                <div class="card-head">
                                    <span class="card-title">🔐 Auth Service Swagger</span>
                                    <span class="card-port">:8081</span>
                                </div>
                                <p class="card-desc">Login, Register, Password Reset, BCrypt Hashing, JWT Bearer Token Validation.</p>
                            </div>
                            <div style="margin-top: 14px; font-size: 0.76rem; color: var(--accent-purple);">Open Swagger UI ➔</div>
                        </a>

                        <a href="http://localhost:8082/swagger-ui/index.html" target="_blank" class="card">
                            <div>
                                <div class="card-head">
                                    <span class="card-title">👥 Member Service Swagger</span>
                                    <span class="card-port">:8082</span>
                                </div>
                                <p class="card-desc">Member CRUD, Profile Lifecycle, Status updates, AI Retention prediction.</p>
                            </div>
                            <div style="margin-top: 14px; font-size: 0.76rem; color: #38bdf8;">Open Swagger UI ➔</div>
                        </a>

                        <a href="http://localhost:8083/swagger-ui/index.html" target="_blank" class="card">
                            <div>
                                <div class="card-head">
                                    <span class="card-title">💳 Subscription Service Swagger</span>
                                    <span class="card-port">:8083</span>
                                </div>
                                <p class="card-desc">Plans (Basic, Premium, All-Access), Validity dates, automated renewals, Courtesy AI.</p>
                            </div>
                            <div style="margin-top: 14px; font-size: 0.76rem; color: #34d399;">Open Swagger UI ➔</div>
                        </a>

                        <a href="http://localhost:8084/swagger-ui/index.html" target="_blank" class="card">
                            <div>
                                <div class="card-head">
                                    <span class="card-title">⏱️ Attendance Service Swagger</span>
                                    <span class="card-port">:8084</span>
                                </div>
                                <p class="card-desc">High-speed RFID turnstile check-in engine, Feign verification, Anti-tailgate AI.</p>
                            </div>
                            <div style="margin-top: 14px; font-size: 0.76rem; color: #f472b6;">Open Swagger UI ➔</div>
                        </a>
                    </div>

                    <div class="section-title">🔀 Active Gateway Ingress Routing Table</div>
                    <div style="background: rgba(0,0,0,0.3); border-radius: 12px; border: 1px solid var(--border-color); overflow: hidden;">
                        <table class="routes-table">
                            <thead>
                                <tr>
                                    <th>Route Path</th>
                                    <th>Destination Microservice</th>
                                    <th>Security Filter</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="color: #38bdf8;">/api/auth/**</td>
                                    <td>lb://AUTH-SERVICE (:8081)</td>
                                    <td style="color: #34d399;">Public (PermitAll)</td>
                                </tr>
                                <tr>
                                    <td style="color: #38bdf8;">/api/members/**</td>
                                    <td>lb://MEMBER-SERVICE (:8082)</td>
                                    <td style="color: #fbbf24;">JwtAuthenticationFilter (Bearer)</td>
                                </tr>
                                <tr>
                                    <td style="color: #38bdf8;">/api/subscriptions/**</td>
                                    <td>lb://SUBSCRIPTION-SERVICE (:8083)</td>
                                    <td style="color: #fbbf24;">JwtAuthenticationFilter (Bearer)</td>
                                </tr>
                                <tr>
                                    <td style="color: #38bdf8;">/api/attendance/**</td>
                                    <td>lb://ATTENDANCE-SERVICE (:8084)</td>
                                    <td style="color: #fbbf24;">JwtAuthenticationFilter (Bearer)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>
            </body>
            </html>
            """;
        return Mono.just(html);
    }

    @GetMapping(value = "/api/gateway/health")
    public Mono<Map<String, Object>> health() {
        return Mono.just(Map.of(
            "status", "UP",
            "service", "api-gateway",
            "port", 8080,
            "timestamp", System.currentTimeMillis()
        ));
    }

    @GetMapping(value = "/actuator/info")
    public Mono<Map<String, Object>> actuatorInfo() {
        return Mono.just(Map.of(
            "app", Map.of(
                "name", "PulseFIT API Gateway",
                "description", "Spring Cloud Gateway Ingress with Unified Swagger UI",
                "version", "1.0.0"
            ),
            "status", "UP",
            "port", 8080,
            "swaggerUi", "http://localhost:8080/swagger-ui.html"
        ));
    }

    @GetMapping(value = "/actuator/health")
    public Mono<Map<String, Object>> actuatorHealth() {
        return Mono.just(Map.of(
            "status", "UP",
            "service", "api-gateway",
            "port", 8080
        ));
    }
}
