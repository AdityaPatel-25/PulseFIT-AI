import React, { useState, useEffect } from 'react';
import { attendanceApi, memberApi, subscriptionApi } from '../api/client';
import { soundFX } from '../utils/audio';
import { 
  ScanLine, Users, CreditCard, Activity, CheckCircle2, XCircle, 
  MapPin, Clock, Search, UserPlus, Sparkles, AlertTriangle, 
  RefreshCw, LogOut, ArrowRight, Shield, ShieldAlert, Phone, Mail
} from 'lucide-react';

export default function StaffConsole({ user }) {
  const [activeTab, setActiveTab] = useState('desk-turnstile'); // 'desk-turnstile' | 'members' | 'live-feed'
  const [members, setMembers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Turnstile state
  const [memberInputId, setMemberInputId] = useState(1);
  const [facilityId, setFacilityId] = useState('FACILITY_DOWNTOWN');
  const [facilityName, setFacilityName] = useState('PulseFit Downtown Elite');
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [deskMessage, setDeskMessage] = useState('');

  // Member Search & Register
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', contact: '', email: '', address: '' });
  
  // Fast Renewal Modal
  const [renewMemberId, setRenewMemberId] = useState(null);
  const [renewMonths, setRenewMonths] = useState(3);

  const facilities = [
    { id: 'FACILITY_DOWNTOWN', name: 'PulseFit Downtown Elite', occupancy: 94, max: 150 },
    { id: 'FACILITY_UPTOWN', name: 'PulseFit Uptown Olympic', occupancy: 68, max: 200 },
    { id: 'FACILITY_WESTSIDE', name: 'PulseFit Westside Express', occupancy: 42, max: 80 }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, aRes] = await Promise.all([
        memberApi.getAll().catch(() => ({ data: [] })),
        attendanceApi.getRecent().catch(() => ({ data: [] }))
      ]);
      setMembers(mRes.data || []);
      setLogs(aRes.data || []);
    } catch (err) {
      console.error('Staff console data load error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      attendanceApi.getRecent().then(res => setLogs(res.data || [])).catch(() => {});
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Desk Check-In
  const handleDeskCheckIn = async (targetId) => {
    const idToUse = targetId || memberInputId;
    setScanning(true);
    setLastResult(null);
    soundFX.playScanClick();

    try {
      const res = await attendanceApi.checkIn({
        memberId: Number(idToUse),
        facilityId: facilityId,
        facilityName: facilityName
      });
      setLastResult(res.data);
      if (res.data.granted) {
        soundFX.playGranted();
      } else {
        soundFX.playDenied();
      }
      loadData();
    } catch (err) {
      soundFX.playDenied();
      setLastResult(err.response?.data || {
        granted: false,
        message: 'Network check-in failed'
      });
    } finally {
      setScanning(false);
    }
  };

  // Fast Walk-in Member Registration
  const handleCreateWalkin = async (e) => {
    e.preventDefault();
    try {
      const res = await memberApi.create(newMember);
      const createdId = res.data.memberId;

      // Also assign a default 3-month subscription
      await subscriptionApi.create({
        memberId: createdId,
        planType: 'PREMIUM_QUARTERLY',
        facilityTier: 'MULTI_FACILITY',
        price: 149.99,
        autoRenew: true
      });

      setShowAddModal(false);
      setNewMember({ name: '', contact: '', email: '', address: '' });
      setDeskMessage(`Registered #${createdId} ${res.data.name} with 3-Month Premium Plan! Ready to swipe.`);
      setTimeout(() => setDeskMessage(''), 6000);
      setMemberInputId(createdId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
    }
  };

  // Fast Renewal
  const handleRenew = async (memberId) => {
    try {
      // Find active or latest subscription
      const subRes = await subscriptionApi.getByMember(memberId);
      if (!subRes.data || subRes.data.length === 0) {
        alert('No existing subscription found to renew');
        return;
      }
      const sub = subRes.data[0];
      await subscriptionApi.renew(sub.subscriptionId, {
        extensionMonths: Number(renewMonths),
        updatedPlanType: sub.planType,
        renewalPrice: Number(renewMonths) * 45
      });
      soundFX.playGranted();
      setDeskMessage(`Member #${memberId} subscription extended by ${renewMonths} months! Access granted.`);
      setTimeout(() => setDeskMessage(''), 5000);
      setRenewMemberId(null);
      loadData();
    } catch (err) {
      alert('Renewal failed');
    }
  };

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.memberId?.toString().includes(searchQuery) ||
    m.contact?.includes(searchQuery)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px 32px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)', border: '1px solid rgba(6, 182, 212, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>🧑‍💼 Front-Desk Staff Console</span>
            <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>GATEWAY :8080 CONNECTED</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Front-Desk Access Terminal</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Logged in as: <strong style={{ color: '#38bdf8' }}>staff_john</strong> • Operator ID: <span className="font-mono">#STF-409</span> • Facility Station: <strong>{facilityName}</strong>
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('desk-turnstile')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'desk-turnstile' ? '#06b6d4' : 'transparent',
              color: activeTab === 'desk-turnstile' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ScanLine size={16} /> Desk Gate Swipe
          </button>
          <button
            onClick={() => setActiveTab('members')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'members' ? '#06b6d4' : 'transparent',
              color: activeTab === 'members' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={16} /> Member Desk & Lookup
          </button>
          <button
            onClick={() => setActiveTab('live-feed')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'live-feed' ? '#06b6d4' : 'transparent',
              color: activeTab === 'live-feed' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Activity size={16} /> Live Stream ({logs.length})
          </button>
        </div>
      </div>

      {deskMessage && (
        <div style={{ padding: '12px 18px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '12px', color: '#38bdf8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{deskMessage}</span>
        </div>
      )}

      {/* TAB 1: DESK TURNSTILE */}
      {activeTab === 'desk-turnstile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          
          {/* Desk Gate Controller */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
              Front-Desk Gate Terminal
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Operate turnstile check-ins directly from the reception desk
            </p>

            {/* Facility Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Active Turnstile Gate Location:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {facilities.map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFacilityId(f.id);
                      setFacilityName(f.name);
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      background: facilityId === f.id ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: facilityId === f.id ? '1px solid #06b6d4' : '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <strong style={{ fontSize: '0.88rem', display: 'block' }}>{f.name.replace('PulseFit ', '')}</strong>
                    <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>{f.occupancy}/{f.max} capacity</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Swipe Buttons for Test Members */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Quick Check-In Presets:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setMemberInputId(1); handleDeskCheckIn(1); }}
                  className="btn btn-secondary"
                  style={{ padding: '10px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}
                >
                  <strong style={{ color: '#34d399' }}>#1 Alex Mercer</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>VIP Pass (GRANTED)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setMemberInputId(2); handleDeskCheckIn(2); }}
                  className="btn btn-secondary"
                  style={{ padding: '10px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}
                >
                  <strong style={{ color: '#38bdf8' }}>#2 Sarah Connor</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Premium (GRANTED)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setMemberInputId(3); handleDeskCheckIn(3); }}
                  className="btn btn-secondary"
                  style={{ padding: '10px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}
                >
                  <strong style={{ color: '#f87171' }}>#3 Marcus Vance</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Expired (DENIED)</span>
                </button>
              </div>
            </div>

            {/* Custom Input */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                type="number"
                className="input-field"
                value={memberInputId}
                onChange={(e) => setMemberInputId(e.target.value)}
                placeholder="Enter Member ID..."
                style={{ width: '160px' }}
              />
              <button
                onClick={() => handleDeskCheckIn(memberInputId)}
                disabled={scanning}
                className="btn btn-accent"
                style={{ flex: 1, padding: '12px' }}
              >
                <ScanLine size={18} />
                <span>{scanning ? 'Verifying with Feign Mesh...' : 'Desk Swipe & Verify Pass'}</span>
              </button>
            </div>

            {/* Turnstile Output Screen */}
            {lastResult && (
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                background: lastResult.granted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `2px solid ${lastResult.granted ? '#10b981' : '#ef4444'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                {lastResult.granted ? <CheckCircle2 size={36} color="#10b981" /> : <XCircle size={36} color="#ef4444" />}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: lastResult.granted ? '#34d399' : '#f87171' }}>
                      {lastResult.granted ? 'GATE BARRIER OPENED' : 'ACCESS REJECTED'}
                    </h4>
                    <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>GATE #01</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '4px' }}>
                    {lastResult.message}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Member: <strong>{lastResult.memberName || `ID #${lastResult.memberId}`}</strong> • Facility: <strong>{facilityName}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Desk Operations & Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Quick Walk-In Registration Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserPlus size={18} color="#06b6d4" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Walk-In Registration</h3>
                </div>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>FAST PASS</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Instantly create a new member profile and assign a 3-month access pass at the desk.
              </p>
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ width: '100%' }}>
                <UserPlus size={16} />
                <span>Register Walk-in Member</span>
              </button>
            </div>

            {/* Quick Renew Expired Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#fbbf24" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Desk Pass Renewal</h3>
                </div>
                <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>OVERRIDE</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Member #3 Marcus Vance pass is expired. Extend it right here to let them in:
              </p>
              <button
                onClick={() => handleRenew(3)}
                className="btn btn-secondary"
                style={{ width: '100%', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              >
                <Sparkles size={16} color="#fbbf24" />
                <span>Renew Marcus Vance (+3 Months)</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: MEMBERS DIRECTORY */}
      {activeTab === 'members' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Search member by name, ID or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
              <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <UserPlus size={16} />
              <span>Register Member</span>
            </button>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Desk Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(m => (
                <tr key={m.memberId}>
                  <td><span className="font-mono" style={{ color: '#06b6d4', fontWeight: 700 }}>#{m.memberId}</span></td>
                  <td><strong>{m.name}</strong></td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.contact}</span>
                  </td>
                  <td>
                    <span className={`badge ${m.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setMemberInputId(m.memberId);
                        setActiveTab('desk-turnstile');
                        handleDeskCheckIn(m.memberId);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      <ScanLine size={14} />
                      <span>Swipe at Gate</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: LIVE STREAM */}
      {activeTab === 'live-feed' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Real-Time Turnstile Event Feed</h3>
            <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>AUTO-REFRESHING 6S</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {logs.slice(0, 10).map(log => {
              const isGranted = log.accessStatus === 'GRANTED';
              return (
                <div key={log.attendanceId} style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {isGranted ? <CheckCircle2 size={24} color="#10b981" /> : <XCircle size={24} color="#ef4444" />}
                    <div>
                      <strong style={{ fontSize: '0.92rem' }}>Member #{log.memberId}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                        Gate: {log.facilityName || log.facilityId}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${isGranted ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.65rem' }}>
                      {log.accessStatus}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      {new Date(log.checkInTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Walk-in Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>Front-Desk Walk-In Registration</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Creates member in Member Service (:8082) & activates 3-Month Plan in Subscription Service (:8083)
            </p>

            <form onSubmit={handleCreateWalkin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="e.g. David Miller"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Contact Phone *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newMember.contact}
                  onChange={(e) => setNewMember({ ...newMember, contact: e.target.value })}
                  placeholder="+1-555-4019"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="dmiller@pulsefit.com"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create & Issue Pass</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
