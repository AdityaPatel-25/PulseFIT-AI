import React, { useState, useEffect } from 'react';
import { attendanceApi, memberApi, subscriptionApi } from '../api/client';
import { soundFX } from '../utils/audio';
import { 
  ScanLine, Users, CreditCard, Activity, CheckCircle2, XCircle, 
  MapPin, Clock, Search, UserPlus, Sparkles, AlertTriangle, 
  RefreshCw, LogOut, ArrowRight, Shield, ShieldAlert, Phone, Mail, X
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
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px 28px', 
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.09) 0%, rgba(139, 92, 246, 0.05) 100%)', 
          border: '1px solid rgba(6, 182, 212, 0.22)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>🧑‍💼 Front-Desk Staff Console</span>
            <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>GATEWAY :8080 CONNECTED</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Front-Desk Access Terminal
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
            Logged in as: <strong style={{ color: 'var(--accent-cyan)' }}>{user?.username || 'staff_john'}</strong> • Operator ID: <span className="font-mono">#STF-409</span> • Facility Station: <strong style={{ color: 'var(--text-main)' }}>{facilityName}</strong>
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(0, 0, 0, 0.45)', padding: '5px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          {[
            { id: 'desk-turnstile', label: 'Desk Gate Swipe', icon: ScanLine },
            { id: 'members', label: 'Member Desk & Lookup', icon: Users },
            { id: 'live-feed', label: `Live Stream (${logs.length})`, icon: Activity },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--accent-teal)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {deskMessage && (
        <div 
          style={{ 
            padding: '12px 18px', 
            background: 'rgba(6, 182, 212, 0.12)', 
            border: '1px solid rgba(6, 182, 212, 0.28)', 
            borderRadius: 'var(--radius-md)', 
            color: 'var(--accent-cyan)', 
            fontSize: '0.88rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}
        >
          <CheckCircle2 size={18} color="var(--accent-cyan)" />
          <span>{deskMessage}</span>
        </div>
      )}

      {/* TAB 1: DESK TURNSTILE */}
      {activeTab === 'desk-turnstile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          
          {/* Desk Gate Controller */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
              Front-Desk Gate Terminal
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
              Operate turnstile check-ins directly from the reception desk
            </p>

            {/* Facility Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Turnstile Gate Location:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {facilities.map(f => {
                  const isSelected = facilityId === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFacilityId(f.id);
                        setFacilityName(f.name);
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(6, 182, 212, 0.16)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <strong style={{ fontSize: '0.84rem', display: 'block', color: isSelected ? '#ffffff' : 'var(--text-main)' }}>
                        {f.name.replace('PulseFit ', '')}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-dim)' }}>
                        {f.occupancy}/{f.max} capacity
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Swipe Buttons for Test Members */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Quick Check-In Presets:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { id: 1, name: 'Alex Mercer', tag: 'VIP Pass (GRANTED)', color: '#34d399' },
                  { id: 2, name: 'Sarah Connor', tag: 'Premium (GRANTED)', color: '#38bdf8' },
                  { id: 3, name: 'Marcus Vance', tag: 'Expired (DENIED)', color: '#f87171' },
                ].map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => { setMemberInputId(preset.id); handleDeskCheckIn(preset.id); }}
                    className="btn btn-secondary"
                    style={{ 
                      padding: '10px 12px', 
                      fontSize: '0.8rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'flex-start', 
                      gap: '3px',
                      textAlign: 'left'
                    }}
                  >
                    <strong style={{ color: preset.color, fontSize: '0.82rem' }}>#{preset.id} {preset.name}</strong>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{preset.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                type="number"
                className="input-field"
                value={memberInputId}
                onChange={(e) => setMemberInputId(e.target.value)}
                placeholder="Member ID..."
                style={{ width: '150px' }}
              />
              <button
                onClick={() => handleDeskCheckIn(memberInputId)}
                disabled={scanning}
                className="btn btn-accent"
                style={{ flex: 1, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <ScanLine size={16} />
                <span>{scanning ? 'Verifying with Feign Mesh...' : 'Desk Swipe & Verify Pass'}</span>
              </button>
            </div>

            {/* Turnstile Output Screen */}
            {lastResult && (
              <div 
                style={{
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-lg)',
                  background: lastResult.granted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${lastResult.granted ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                {lastResult.granted ? (
                  <CheckCircle2 size={32} color="#10b981" style={{ flexShrink: 0 }} />
                ) : (
                  <XCircle size={32} color="#ef4444" style={{ flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: lastResult.granted ? '#34d399' : '#f87171' }}>
                      {lastResult.granted ? 'GATE BARRIER OPENED' : 'ACCESS REJECTED'}
                    </h4>
                    <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', padding: '2px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}>
                      GATE #01
                    </span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                    {lastResult.message}
                  </p>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Member: <strong style={{ color: 'var(--text-main)' }}>{lastResult.memberName || `ID #${lastResult.memberId}`}</strong> • Facility: <strong style={{ color: 'var(--text-main)' }}>{facilityName}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Desk Operations & Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Quick Walk-In Registration Card */}
            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserPlus size={18} color="var(--accent-cyan)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Walk-In Registration</h3>
                </div>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>FAST PASS</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Instantly create a new member profile and assign a 3-month access pass at the desk.
              </p>
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <UserPlus size={15} />
                <span>Register Walk-in Member</span>
              </button>
            </div>

            {/* Quick Renew Expired Card */}
            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#fbbf24" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Desk Pass Renewal</h3>
                </div>
                <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>OVERRIDE</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                Member #3 Marcus Vance pass is expired. Extend it right here to let them in:
              </p>
              <button
                onClick={() => handleRenew(3)}
                className="btn btn-secondary"
                style={{ width: '100%', borderColor: 'rgba(245, 158, 11, 0.35)', justifyContent: 'center' }}
              >
                <Sparkles size={15} color="#fbbf24" />
                <span>Renew Marcus Vance (+3 Months)</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: MEMBERS DIRECTORY */}
      {activeTab === 'members' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Search member by name, ID or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px', width: '100%' }}
              />
              <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <UserPlus size={15} />
              <span>Register Member</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ textAlign: 'right', width: '150px' }}>Desk Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No members found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map(m => (
                    <tr key={m.memberId}>
                      <td><span className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>#{m.memberId}</span></td>
                      <td><strong style={{ color: 'var(--text-main)' }}>{m.name}</strong></td>
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
                          <ScanLine size={13} />
                          <span>Swipe at Gate</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE STREAM */}
      {activeTab === 'live-feed' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 4px 0' }}>Real-Time Turnstile Event Feed</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Showing latest access transactions from all facility barriers</p>
            </div>
            <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>AUTO-REFRESHING 6S</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                No attendance events logged yet.
              </div>
            ) : (
              logs.slice(0, 10).map(log => {
                const isGranted = log.accessStatus === 'GRANTED';
                return (
                  <div 
                    key={log.attendanceId} 
                    style={{ 
                      padding: '12px 18px', 
                      background: 'rgba(255,255,255,0.02)', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid var(--border-color)', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isGranted ? <CheckCircle2 size={20} color="#10b981" /> : <XCircle size={20} color="#ef4444" />}
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>Member #{log.memberId}</strong>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>
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
              })
            )}
          </div>
        </div>
      )}

      {/* Add Walk-in Modal */}
      {showAddModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 100, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'rgba(0, 0, 0, 0.7)', 
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Front-Desk Walk-In Registration</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Registers in Member Service (:8082) & assigns 3-Month Plan (:8083)
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateWalkin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Full Name *</label>
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
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Contact Phone *</label>
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
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="dmiller@pulsefit.com"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
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
