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

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px', position: 'relative' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Key size={24} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>JWT Authentication</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Authenticate with PulseFit Auth Service (:8081)</p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#f87171', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Fill Preset Buttons */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '8px' }}>
            Quick-Select Test Role:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => quickSelect('admin', 'admin123')}
              className="btn btn-secondary"
              style={{ padding: '8px 6px', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', borderColor: username === 'admin' ? '#a78bfa' : undefined }}
            >
              <span>👑 Admin</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>Command Center</span>
            </button>
            <button
              type="button"
              onClick={() => quickSelect('staff_john', 'staff123')}
              className="btn btn-secondary"
              style={{ padding: '8px 6px', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', borderColor: username === 'staff_john' ? '#06b6d4' : undefined }}
            >
              <span>🧑‍💼 Staff</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>Front-Desk Window</span>
            </button>
            <button
              type="button"
              onClick={() => quickSelect('member_alex', 'member123')}
              className="btn btn-secondary"
              style={{ padding: '8px 6px', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', borderColor: username === 'member_alex' ? '#10b981' : undefined }}
            >
              <span>🏃 Member</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>Personal Portal</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ paddingLeft: '38px' }}
              />
              <User size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '38px' }}
              />
              <Lock size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            {loading ? 'Authenticating...' : (
              <>
                <span>Sign In & Generate JWT</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
