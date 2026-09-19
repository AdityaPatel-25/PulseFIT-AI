import React, { useState, useEffect } from 'react';
import { memberApi } from '../api/client';
import { Users, UserPlus, RefreshCw, CheckCircle, Ban, Mail, Phone, MapPin } from 'lucide-react';

export default function MemberManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    address: '',
    emergencyContact: ''
  });
  const [message, setMessage] = useState('');

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await memberApi.getAll();
      setMembers(res.data);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleCreateMember = async (e) => {
    e.preventDefault();
    try {
      await memberApi.create(formData);
      setShowAddModal(false);
      setFormData({ name: '', contact: '', email: '', address: '', emergencyContact: '' });
      setMessage('New member created successfully!');
      setTimeout(() => setMessage(''), 4000);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create member');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm(`Are you sure you want to deactivate Member ID ${id}? This will revoke their turnstile entry access.`)) return;
    try {
      await memberApi.deactivate(id);
      fetchMembers();
    } catch (err) {
      alert('Failed to deactivate member');
    }
  };

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Member Directory</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Manage club member records served by Member Service (:8082)</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchMembers} className="btn btn-secondary" style={{ padding: '8px 14px' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <UserPlus size={16} />
            <span>Register New Member</span>
          </button>
        </div>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: '#34d399', fontSize: '0.85rem', marginBottom: '20px' }}>
          {message}
        </div>
      )}

      {/* Members Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Full Name</th>
              <th>Contact Info</th>
              <th>Address</th>
              <th>Emergency Contact</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading member profiles from Member Service...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No members found in system.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.memberId}>
                  <td>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      #{m.memberId}
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.92rem' }}>{m.name}</strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} color="var(--text-dim)" /> {m.contact}
                      </span>
                      {m.email && (
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} color="var(--text-dim)" /> {m.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} color="var(--text-dim)" /> {m.address || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {m.emergencyContact || 'None'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${m.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {m.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleDeactivate(m.memberId)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#f87171' }}
                        title="Deactivate Member"
                      >
                        <Ban size={14} />
                        <span>Deactivate</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Deactivated</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>Register New Member Profile</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Persisted in Member Service table: member_id, name, contact
            </p>

            <form onSubmit={handleCreateMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Johnathan Davis"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Contact Phone *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="e.g. +1-555-0188"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. jdavis@fitmail.com"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Residential Address
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 500 Market St, San Francisco"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Emergency Contact
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="e.g. +1-555-9922"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Member Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
