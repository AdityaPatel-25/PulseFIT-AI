import React, { useState } from 'react';
import { authApi } from '../api/client';
import { Shield, Key, User, Lock, ArrowRight, X, AlertCircle } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authApi.login(username, password);
      localStorage.setItem('pulsefit_token', res.data.token);
      localStorage.setItem('pulsefit_user', JSON.stringify({
        username: res.data.username,
        role: res.data.role,
        email: res.data.email
      }));
      onLoginSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickSelect = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const rolePresets = [
    { user: 'admin', pass: 'admin123', icon: '👑', label: 'Admin', sub: 'Command Center', color: '#a78bfa' },
    { user: 'staff_john', pass: 'staff123', icon: '🧑‍💼', label: 'Staff', sub: 'Front-Desk Window', color: '#22d3ee' },
    { user: 'member_alex', pass: 'member123', icon: '🏃', label: 'Member', sub: 'Personal Portal', color: '#34d399' },
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-overlay)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '28px 28px 32px', position: 'relative', boxShadow: 'var(--shadow-xl)' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px', borderRadius: '6px', transition: 'color 0.15s ease' }}>
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'rgba(6, 182, 212, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
            <Key size={22} color="#22d3ee" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>JWT Authentication</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Authenticate with PulseFit Auth Service (:8081)</p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Fill Preset Buttons */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '8px' }}>
            Quick-Select Test Role:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {rolePresets.map(r => (
              <button
                key={r.user}
                type="button"
                onClick={() => quickSelect(r.user, r.pass)}
                className="btn btn-secondary"
                style={{ padding: '8px 6px', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', borderColor: username === r.user ? r.color : undefined }}
              >
                <span>{r.icon} {r.label}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{r.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ paddingLeft: '38px' }}
              />
              <User size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '38px' }}
              />
              <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '4px', padding: '11px' }}
          >
            {loading ? 'Authenticating...' : (
              <>
                <span>Sign In & Generate JWT</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
