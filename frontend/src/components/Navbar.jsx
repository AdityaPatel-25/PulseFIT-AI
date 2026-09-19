import React from 'react';
import { Activity, Shield, Users, CreditCard, ScanLine, LogOut, LogIn, Cpu, Radio, LayoutDashboard, Briefcase, UserCheck, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout, onOpenLogin, onSwitchRole, onOpenSignInPage, onOpenValidation }) {
  const adminNavItems = [
    { id: 'turnstile', label: 'Turnstile Simulator', icon: ScanLine },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'attendance', label: 'Live Attendance', icon: Activity },
    { id: 'ai-hub', label: 'AI Innovations', icon: Sparkles },
    { id: 'services', label: 'Service Mesh', icon: Cpu },
  ];

  const currentRole = user?.role || 'ROLE_ADMIN';

  return (
    <header style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(9, 13, 22, 0.95)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50 }}>
      
      {/* Live Turnstile Event Ticker */}
      <div style={{ background: '#030712', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '5px 24px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700 }}>
            <Radio size={12} className="animate-pulse-glow" /> LIVE FEED
          </span>
          <span style={{ color: 'var(--text-dim)' }}>|</span>
          <span style={{ color: '#e2e8f0' }}>Downtown Elite: Member #1 Alex Mercer (VIP Pass) <span style={{ color: '#34d399' }}>GRANTED (48ms)</span></span>
          <span style={{ color: 'var(--text-dim)' }}>•</span>
          <span style={{ color: '#e2e8f0' }}>Westside Express: Member #3 Marcus Vance (Expired Pass) <span style={{ color: '#f87171' }}>DENIED</span></span>
          <span style={{ color: 'var(--text-dim)' }}>•</span>
          <span style={{ color: '#38bdf8' }}>Eureka Registry: 5 Microservices Connected</span>
        </div>
        <div className="font-mono" style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
          GATEWAY :8080 ➔ FEIGN MESH ACTIVE
        </div>
      </div>

      {/* Main Nav Bar */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => setActiveTab('turnstile')}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
            <Activity size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(to right, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                PulseFIT
              </span>
              <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>SOA CLOUD</span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Multi-Facility Platform</p>
          </div>
        </div>

        {/* ROLE WINDOW SWITCHER (Prominent center controls) */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '4px' }}>
          <button
            onClick={() => onSwitchRole('ROLE_ADMIN', 'admin', 'admin123')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '10px',
              border: 'none',
              background: currentRole === 'ROLE_ADMIN' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0.15) 100%)' : 'transparent',
              borderBottom: currentRole === 'ROLE_ADMIN' ? '2px solid #a78bfa' : '2px solid transparent',
              color: currentRole === 'ROLE_ADMIN' ? '#c4b5fd' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <span>👑</span>
            <span>Admin Window</span>
          </button>

          <button
            onClick={() => onSwitchRole('ROLE_STAFF', 'staff_john', 'staff123')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '10px',
              border: 'none',
              background: currentRole === 'ROLE_STAFF' ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(6, 182, 212, 0.15) 100%)' : 'transparent',
              borderBottom: currentRole === 'ROLE_STAFF' ? '2px solid #06b6d4' : '2px solid transparent',
              color: currentRole === 'ROLE_STAFF' ? '#67e8f9' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <span>🧑‍💼</span>
            <span>Staff Window</span>
          </button>

          <button
            onClick={() => onSwitchRole('ROLE_MEMBER', 'member_alex', 'member123')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '10px',
              border: 'none',
              background: currentRole === 'ROLE_MEMBER' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.15) 100%)' : 'transparent',
              borderBottom: currentRole === 'ROLE_MEMBER' ? '2px solid #10b981' : '2px solid transparent',
              color: currentRole === 'ROLE_MEMBER' ? '#6ee7b7' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <span>🏃</span>
            <span>Member Window</span>
          </button>
        </div>

        {/* User / Auth Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onOpenSignInPage}
            className="btn btn-secondary"
            title="Open Sign-In Page"
            style={{ padding: '7px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(56, 189, 248, 0.4)' }}
          >
            <span>✨ Sign-In</span>
          </button>

          <button
            onClick={onOpenValidation}
            className="btn btn-secondary"
            title="Open Database & JWT Validation Console"
            style={{ padding: '7px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(16, 185, 129, 0.5)', color: '#34d399' }}
          >
            <Shield size={14} color="#34d399" />
            <span>DB & Token Validation</span>
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>{user.username}</p>
                <span className={`badge ${user.role === 'ROLE_ADMIN' ? 'badge-purple' : user.role === 'ROLE_STAFF' ? 'badge-cyan' : 'badge-green'}`} style={{ fontSize: '0.62rem' }}>
                  {user.role ? user.role.replace('ROLE_', '') : 'USER'}
                </span>
              </div>
              <button onClick={onOpenLogin} className="btn btn-secondary" title="Switch User / Login Modal" style={{ padding: '7px 10px', fontSize: '0.78rem' }}>
                <Shield size={15} />
              </button>
              <button onClick={onLogout} className="btn btn-secondary" title="Logout" style={{ padding: '7px 10px' }}>
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenLogin} className="btn btn-primary" style={{ padding: '8px 16px' }}>
              <LogIn size={16} />
              <span>Login (JWT)</span>
            </button>
          )}
        </div>

      </div>

      {/* Admin Sub-Tabs Bar (Only rendered when in Admin Window) */}
      {currentRole === 'ROLE_ADMIN' && (
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0 24px' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                    gap: '8px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s ease',
                    background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                    color: isActive ? '#34d399' : 'var(--text-muted)',
                    borderBottom: isActive ? '2px solid #10b981' : '2px solid transparent'
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
