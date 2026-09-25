import React from 'react';
import { Activity, Shield, Users, CreditCard, ScanLine, LogOut, LogIn, Cpu, Radio, LayoutDashboard, Briefcase, UserCheck, Sparkles, FileCode2 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout, onOpenLogin, onSwitchRole, onOpenSignInPage, onOpenValidation, onOpenSwagger }) {
  const adminNavItems = [
    { id: 'turnstile', label: 'Turnstile Simulator', icon: ScanLine },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'attendance', label: 'Live Attendance', icon: Activity },
    { id: 'ai-hub', label: 'AI Innovations', icon: Sparkles },
    { id: 'swagger', label: 'Swagger API Docs', icon: FileCode2 },
    { id: 'services', label: 'Service Mesh', icon: Cpu },
  ];

  const currentRole = user?.role || 'ROLE_ADMIN';

  return (
    <header style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(8, 9, 14, 0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}>
      
      {/* Live Turnstile Event Ticker */}
      <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid var(--border-subtle)', padding: '5px 24px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#10b981', fontWeight: 600, flexShrink: 0 }}>
            <Radio size={11} className="animate-pulse-glow" /> LIVE FEED
          </span>
          <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}>|</span>
          <span style={{ color: 'var(--text-secondary)' }}>Downtown Elite: Member #1 Alex Mercer (VIP Pass) <span style={{ color: '#34d399' }}>GRANTED (48ms)</span></span>
          <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}>•</span>
          <span style={{ color: 'var(--text-secondary)' }}>Westside Express: Member #3 Marcus Vance (Expired Pass) <span style={{ color: '#f87171' }}>DENIED</span></span>
          <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}>•</span>
          <span style={{ color: '#22d3ee' }}>Eureka Registry: 5 Microservices Connected</span>
        </div>
        <div className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--text-dim)', flexShrink: 0 }}>
          GATEWAY :8080 ➔ FEIGN MESH ACTIVE
        </div>
      </div>

      {/* Main Nav Bar */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flexShrink: 0 }} onClick={() => setActiveTab('turnstile')}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)' }}>
            <Activity size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                PulseFIT
              </span>
              <span className="badge badge-green" style={{ fontSize: '0.58rem', padding: '2px 7px' }}>SOA CLOUD</span>
            </div>
            <p style={{ fontSize: '0.67rem', color: 'var(--text-dim)', lineHeight: 1.2, marginTop: '1px' }}>Multi-Facility Platform</p>
          </div>
        </div>

        {/* ROLE WINDOW SWITCHER */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', gap: '2px' }}>
          {[
            { role: 'ROLE_ADMIN', label: 'Admin Window', icon: '👑', user: 'admin', pass: 'admin123', activeColor: '#a78bfa', activeBg: 'rgba(139, 92, 246, 0.18)' },
            { role: 'ROLE_STAFF', label: 'Staff Window', icon: '🧑‍💼', user: 'staff_john', pass: 'staff123', activeColor: '#22d3ee', activeBg: 'rgba(6, 182, 212, 0.18)' },
            { role: 'ROLE_MEMBER', label: 'Member Window', icon: '🏃', user: 'member_alex', pass: 'member123', activeColor: '#34d399', activeBg: 'rgba(16, 185, 129, 0.18)' },
          ].map(r => {
            const isActive = currentRole === r.role;
            return (
              <button
                key={r.role}
                onClick={() => onSwitchRole(r.role, r.user, r.pass)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? r.activeBg : 'transparent',
                  color: isActive ? r.activeColor : 'var(--text-dim)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  borderBottom: isActive ? `2px solid ${r.activeColor}` : '2px solid transparent'
                }}
              >
                <span style={{ fontSize: '0.85rem' }}>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* User / Auth Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={onOpenSignInPage}
            className="btn btn-secondary"
            title="Open Sign-In Page"
            style={{ padding: '6px 12px', fontSize: '0.76rem', borderColor: 'rgba(34, 211, 238, 0.3)' }}
          >
            <span>✨ Sign-In</span>
          </button>

          <button
            onClick={onOpenSwagger || (() => setActiveTab('swagger'))}
            className="btn btn-secondary"
            title="Open Interactive Swagger UI / OpenAPI 3 Explorer"
            style={{ padding: '6px 12px', fontSize: '0.76rem', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
          >
            <FileCode2 size={13} color="#34d399" />
            <span>Swagger UI</span>
          </button>

          <button
            onClick={onOpenValidation}
            className="btn btn-secondary"
            title="Open Database & JWT Validation Console"
            style={{ padding: '6px 12px', fontSize: '0.76rem', borderColor: 'rgba(168, 85, 247, 0.35)', color: '#c084fc' }}
          >
            <Shield size={13} color="#c084fc" />
            <span>DB & Token Validation</span>
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>{user.username}</p>
                <span className={`badge ${user.role === 'ROLE_ADMIN' ? 'badge-purple' : user.role === 'ROLE_STAFF' ? 'badge-cyan' : 'badge-green'}`} style={{ fontSize: '0.58rem', padding: '1px 7px' }}>
                  {user.role ? user.role.replace('ROLE_', '') : 'USER'}
                </span>
              </div>
              <button onClick={onOpenLogin} className="btn btn-secondary" title="Switch User / Login Modal" style={{ padding: '7px 9px' }}>
                <Shield size={14} />
              </button>
              <button onClick={onLogout} className="btn btn-secondary" title="Logout" style={{ padding: '7px 9px' }}>
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenLogin} className="btn btn-primary" style={{ padding: '8px 16px' }}>
              <LogIn size={15} />
              <span>Login (JWT)</span>
            </button>
          )}
        </div>

      </div>

      {/* Admin Sub-Tabs Bar (Only rendered when in Admin Window) */}
      {currentRole === 'ROLE_ADMIN' && (
        <div style={{ background: 'rgba(8, 10, 18, 0.6)', borderTop: '1px solid var(--border-subtle)', padding: '0 24px' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '2px' }}>
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '10px 16px',
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.15s ease',
                    background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    color: isActive ? '#34d399' : 'var(--text-dim)',
                    borderBottom: isActive ? '2px solid #10b981' : '2px solid transparent',
                    borderRadius: 0
                  }}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
