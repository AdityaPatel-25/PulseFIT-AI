import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileCode2, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  Shield, 
  Users, 
  CreditCard, 
  Activity, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  Terminal,
  Zap,
  Layers
} from 'lucide-react';
import { authApi } from '../api/client';

export default function SwaggerPortal({ user }) {
  const services = [
    {
      id: 'gateway',
      name: 'API Gateway (Unified)',
      port: 8080,
      icon: Layers,
      color: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.12)',
      swaggerUrl: 'http://localhost:8080/swagger-ui.html',
      apiDocsUrl: 'http://localhost:8080/v3/api-docs/auth-service',
      description: 'Unified Gateway OpenAPI Hub. All requests route through Gateway (:8080) with live JWT authentication & filters.',
      endpoints: ['ALL /api/auth/**', 'ALL /api/members/**', 'ALL /api/subscriptions/**', 'ALL /api/attendance/**']
    },
    {
      id: 'auth',
      name: 'Auth Service',
      port: 8081,
      icon: Shield,
      color: '#a78bfa',
      bg: 'rgba(139, 92, 246, 0.12)',
      swaggerUrl: 'http://localhost:8081/swagger-ui/index.html',
      apiDocsUrl: 'http://localhost:8081/v3/api-docs',
      description: 'JWT Authentication, User Registration, Password Hash (BCrypt), Token Validation',
      endpoints: ['POST /api/auth/login', 'POST /api/auth/register', 'GET /api/auth/validate', 'GET /api/auth/users']
    },
    {
      id: 'member',
      name: 'Member Service',
      port: 8082,
      icon: Users,
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.12)',
      swaggerUrl: 'http://localhost:8082/swagger-ui/index.html',
      apiDocsUrl: 'http://localhost:8082/v3/api-docs',
      description: 'Member Profiles, Contact Info, Membership Status Lifecycle, Retention AI',
      endpoints: ['GET /api/members', 'POST /api/members', 'GET /api/members/{id}', 'PUT /api/members/{id}', 'DELETE /api/members/{id}']
    },
    {
      id: 'subscription',
      name: 'Subscription Service',
      port: 8083,
      icon: CreditCard,
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.12)',
      swaggerUrl: 'http://localhost:8083/swagger-ui/index.html',
      apiDocsUrl: 'http://localhost:8083/v3/api-docs',
      description: 'Membership Plans (Basic, Premium, All-Access), Validity Dates, Renewals, Courtesy AI',
      endpoints: ['GET /api/subscriptions', 'POST /api/subscriptions', 'GET /api/subscriptions/member/{id}/active', 'POST /api/subscriptions/{id}/renew']
    },
    {
      id: 'attendance',
      name: 'Attendance Service',
      port: 8084,
      icon: Activity,
      color: '#f472b6',
      bg: 'rgba(244, 114, 182, 0.12)',
      swaggerUrl: 'http://localhost:8084/swagger-ui/index.html',
      apiDocsUrl: 'http://localhost:8084/v3/api-docs',
      description: 'High-speed RFID Turnstile Engine, Feign-based Validation, Anti-Tailgating AI, Fraud Alerts',
      endpoints: ['POST /api/attendance/check-in', 'POST /api/attendance/check-out', 'GET /api/attendance/recent', 'GET /api/attendance/facility/{id}']
    }
  ];

  const [selectedServiceId, setSelectedServiceId] = useState('gateway');
  const [tokenCopied, setTokenCopied] = useState(false);
  const [serviceStatus, setServiceStatus] = useState({});
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const activeService = services.find(s => s.id === selectedServiceId) || services[0];
  const activeToken = localStorage.getItem('pulsefit_token') || '';

  // Check health of all Swagger UI endpoints
  const checkEndpoints = async () => {
    setCheckingStatus(true);
    const newStatus = {};
    for (const svc of services) {
      try {
        await axios.get(svc.apiDocsUrl, { timeout: 2500 });
        newStatus[svc.id] = 'UP';
      } catch (err) {
        // In case CORS blocks docs but service is listening
        newStatus[svc.id] = 'UNKNOWN';
      }
    }
    setServiceStatus(newStatus);
    setCheckingStatus(false);
  };

  useEffect(() => {
    checkEndpoints();
  }, []);

  const handleCopyToken = () => {
    if (!activeToken) {
      alert('No active JWT token found. Please log in first or generate one below.');
      return;
    }
    navigator.clipboard.writeText(activeToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2500);
  };

  const handleQuickLogin = async (username, password) => {
    try {
      const res = await authApi.login(username, password);
      localStorage.setItem('pulsefit_token', res.data.token);
      navigator.clipboard.writeText(res.data.token);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2500);
      alert(`Logged in as ${username}! Token has been copied to your clipboard.`);
    } catch (err) {
      alert(`Could not log in to Auth Service at localhost:8081. Ensure Auth Service is running.`);
    }
  };

  const handleReloadIframe = () => {
    setIframeKey(k => k + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <FileCode2 size={20} />
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                Swagger UI & OpenAPI 3 Interactive Testbench
              </h1>
              <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>SPRINGDOC 3</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '750px', lineHeight: 1.5, margin: 0 }}>
              Live interactive API documentation for each microservice in the PulseFIT platform. You can test endpoints, execute authenticated requests, and verify responses directly through Swagger UI.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={checkEndpoints} 
              className="btn btn-secondary" 
              style={{ padding: '8px 14px', fontSize: '0.78rem' }}
              title="Ping OpenAPI endpoints"
            >
              <RefreshCw size={14} className={checkingStatus ? 'animate-spin' : ''} />
              <span>Ping Docs</span>
            </button>

            <a 
              href={activeService.swaggerUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Open in New Tab</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* JWT Token Quick Authorizer & Fast Presets */}
        <div style={{ marginTop: '20px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={16} color="#fbbf24" />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f1f5f9' }}>Swagger JWT Authorization:</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Click below to copy your active Bearer token, then paste into Swagger's <strong>Authorize 🔓</strong> button.
              </span>
            </div>

            {/* Quick Login Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Generate for:</span>
              <button 
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="btn btn-secondary" 
                style={{ padding: '4px 10px', fontSize: '0.72rem', borderColor: 'rgba(139, 92, 246, 0.35)', color: '#a78bfa' }}
              >
                Admin Token
              </button>
              <button 
                onClick={() => handleQuickLogin('staff_john', 'staff123')}
                className="btn btn-secondary" 
                style={{ padding: '4px 10px', fontSize: '0.72rem', borderColor: 'rgba(6, 182, 212, 0.35)', color: '#22d3ee' }}
              >
                Staff Token
              </button>
              <button 
                onClick={() => handleQuickLogin('member_alex', 'alex123')}
                className="btn btn-secondary" 
                style={{ padding: '4px 10px', fontSize: '0.72rem', borderColor: 'rgba(16, 185, 129, 0.35)', color: '#34d399' }}
              >
                Member Token
              </button>
            </div>
          </div>

          {/* Active Token Copy Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '7px 12px', fontSize: '0.75rem', fontFamily: 'monospace', color: activeToken ? '#a78bfa' : 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeToken ? activeToken : '(No active JWT token - click one of the presets above to generate)'}
            </div>

            <button 
              onClick={handleCopyToken}
              className="btn btn-primary"
              style={{ padding: '7px 16px', fontSize: '0.76rem', background: tokenCopied ? '#059669' : undefined, whiteSpace: 'nowrap' }}
            >
              {tokenCopied ? (
                <>
                  <Check size={14} />
                  <span>Copied! Now Paste in Swagger</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Token for Swagger</span>
                </>
              )}
            </button>
          </div>

          {/* Step Guide */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.72rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            <span><strong>Step 1:</strong> Copy Token 📋</span>
            <span>➔</span>
            <span><strong>Step 2:</strong> In Swagger UI below, click the green <strong>Authorize 🔓</strong> button</span>
            <span>➔</span>
            <span><strong>Step 3:</strong> Paste token in Value box & click <strong>Authorize</strong></span>
            <span>➔</span>
            <span style={{ color: '#34d399' }}><strong>Step 4:</strong> Test any protected endpoint with live 200 OK!</span>
          </div>

        </div>

      </div>

      {/* Service Selector Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {services.map((svc) => {
          const Icon = svc.icon;
          const isSelected = svc.id === selectedServiceId;
          const isUp = serviceStatus[svc.id] === 'UP';

          return (
            <div
              key={svc.id}
              onClick={() => setSelectedServiceId(svc.id)}
              style={{
                cursor: 'pointer',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'rgba(14, 18, 27, 0.7)',
                border: isSelected ? `2px solid ${svc.color}` : '1px solid var(--border-color)',
                boxShadow: isSelected ? `0 0 16px ${svc.color}22` : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: svc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={svc.color} />
                  </div>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: svc.color, fontSize: '0.64rem', fontFamily: 'monospace' }}>
                    :{svc.port}
                  </span>
                </div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 4px 0', color: isSelected ? '#ffffff' : 'var(--text-secondary)' }}>
                  {svc.name}
                </h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  {svc.description}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace' }}>/swagger-ui</span>
                <span style={{ color: svc.color, fontWeight: 600 }}>
                  {isSelected ? '● ACTIVE VIEW' : 'Click to View'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Embedded Swagger UI Frame */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {/* Frame Top Toolbar */}
        <div style={{ padding: '10px 18px', background: 'rgba(8, 10, 18, 0.85)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: activeService.color }} />
            <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>{activeService.name} Swagger UI</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
              ({activeService.swaggerUrl})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handleReloadIframe}
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
              title="Reload Swagger UI frame"
            >
              <RefreshCw size={12} />
              <span>Reload Frame</span>
            </button>
            <a 
              href={activeService.swaggerUrl} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '0.72rem', textDecoration: 'none' }}
              title="Open in standalone tab"
            >
              <ExternalLink size={12} />
              <span>Standalone</span>
            </a>
          </div>
        </div>

        {/* Embedded Iframe */}
        <div style={{ position: 'relative', width: '100%', height: '800px', background: '#1b1b1b' }}>
          <iframe
            key={iframeKey + activeService.id}
            src={activeService.swaggerUrl}
            title={`${activeService.name} Swagger UI`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#ffffff'
            }}
          />
        </div>

      </div>

      {/* Microservice Endpoint Summary Reference */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Terminal size={16} color="#06b6d4" />
          <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: 0 }}>
            {activeService.name} — Registered OpenAPI Endpoints
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {activeService.endpoints.map(ep => {
            const [method, path] = ep.split(' ');
            const methodColor = method === 'GET' ? '#38bdf8' : method === 'POST' ? '#34d399' : method === 'PUT' ? '#fbbf24' : '#f87171';
            const methodBg = method === 'GET' ? 'rgba(56, 189, 248, 0.15)' : method === 'POST' ? 'rgba(52, 211, 153, 0.15)' : method === 'PUT' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(248, 113, 113, 0.15)';

            return (
              <div 
                key={ep} 
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 'var(--radius-sm)', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.78rem',
                  fontFamily: 'monospace'
                }}
              >
                <span style={{ padding: '2px 6px', borderRadius: '4px', background: methodBg, color: methodColor, fontWeight: 700, fontSize: '0.68rem' }}>
                  {method}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{path}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
