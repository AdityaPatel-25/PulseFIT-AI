import React, { useState, useEffect } from 'react';
import { attendanceApi, subscriptionApi, memberApi } from '../api/client';
import { soundFX } from '../utils/audio';
import { 
  CreditCard, ScanLine, CheckCircle2, XCircle, Clock, MapPin, 
  Calendar, Sparkles, RefreshCw, LogOut, ArrowRight, ShieldCheck, 
  Activity, User, Zap, Award, QrCode
} from 'lucide-react';

export default function MemberPortal({ user }) {
  const memberId = 1; // Alex Mercer ID #1
  const [member, setMember] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Turnstile Tap State
  const [selectedFacility, setSelectedFacility] = useState({
    id: 'FACILITY_DOWNTOWN',
    name: 'PulseFit Downtown Elite'
  });
  const [tapping, setTapping] = useState(false);
  const [tapResult, setTapResult] = useState(null);
  const [activeCheckInId, setActiveCheckInId] = useState(null);
  const [renewing, setRenewing] = useState(false);
  const [renewMessage, setRenewMessage] = useState('');

  const facilities = [
    { id: 'FACILITY_DOWNTOWN', name: 'PulseFit Downtown Elite', loc: 'Downtown Financial District' },
    { id: 'FACILITY_UPTOWN', name: 'PulseFit Uptown Olympic', loc: 'Olympic Pool & Spa' },
    { id: 'FACILITY_WESTSIDE', name: 'PulseFit Westside Express', loc: 'High-Intensity Studio' }
  ];

  const loadMemberData = async () => {
    setLoading(true);
    try {
      const [mRes, sRes, aRes] = await Promise.all([
        memberApi.getById(memberId).catch(() => ({ data: { memberId: 1, name: 'Alex Mercer', contact: '+1-555-0101', email: 'alex.mercer@pulsefit.com', status: 'ACTIVE' } })),
        subscriptionApi.getActiveForMember(memberId).catch(() => ({ data: null })),
        attendanceApi.getByMember(memberId).catch(() => ({ data: [] }))
      ]);
      setMember(mRes.data);
      setSubscription(sRes.data);
      setHistory(aRes.data || []);
    } catch (err) {
      console.error('Failed loading member portal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemberData();
  }, []);

  // Digital NFC Tap Check-In
  const handleTapGate = async () => {
    setTapping(true);
    setTapResult(null);
    soundFX.playScanClick();

    try {
      const res = await attendanceApi.checkIn({
        memberId: memberId,
        facilityId: selectedFacility.id,
        facilityName: selectedFacility.name
      });
      setTapResult(res.data);
      if (res.data.granted) {
        soundFX.playGranted();
        setActiveCheckInId(res.data.attendanceId);
      } else {
        soundFX.playDenied();
      }
      loadMemberData(); // refresh history
    } catch (err) {
      soundFX.playDenied();
      setTapResult(err.response?.data || {
        granted: false,
        message: 'Gate tap failed — could not communicate with Turnstile'
      });
    } finally {
      setTapping(false);
    }
  };

  // Digital Check-Out
  const handleCheckOut = async () => {
    try {
      await attendanceApi.checkOut({
        memberId: memberId,
        attendanceId: activeCheckInId
      });
      soundFX.playGranted();
      setActiveCheckInId(null);
      setTapResult({ granted: true, message: 'Check-out recorded. Great workout session!' });
      loadMemberData();
    } catch (err) {
      alert(err.response?.data?.error || 'Check-out failed');
    }
  };

  // Quick Renew
  const handleQuickRenew = async () => {
    if (!subscription) return;
    setRenewing(true);
    try {
      await subscriptionApi.renew(subscription.subscriptionId, {
        extensionMonths: 3,
        updatedPlanType: subscription.planType,
        renewalPrice: 135.00
      });
      soundFX.playGranted();
      setRenewMessage('Subscription renewed for +3 Months! Turnstile pass extended.');
      setTimeout(() => setRenewMessage(''), 5000);
      loadMemberData();
    } catch (err) {
      alert('Renewal failed');
    } finally {
      setRenewing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Member Window Banner */}
      <div className="glass-panel" style={{ padding: '24px 32px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>🏃 Member Self-Service Window</span>
            <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>JWT Authenticated (:8081)</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Welcome back, Alex Mercer!</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Digital Pass ID: <span className="font-mono" style={{ color: '#34d399', fontWeight: 700 }}>#001-VIP</span> • Facility Tier: <strong style={{ color: '#f3f4f6' }}>All-Access Elite Multi-Club</strong>
          </p>
        </div>
        <button onClick={loadMemberData} className="btn btn-secondary" style={{ padding: '8px 14px' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Sync Status</span>
        </button>
      </div>

      {renewMessage && (
        <div style={{ padding: '12px 18px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: '#34d399', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{renewMessage}</span>
        </div>
      )}

      {/* Grid: Left Column Digital Pass & Tap | Right Column Subscription & History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '28px' }}>
        
        {/* LEFT: Digital RFID Pass + Turnstile Tap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Holographic RFID Card */}
          <div style={{ 
            background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 50%, #1e1b4b 100%)', 
            borderRadius: '24px', 
            padding: '28px', 
            border: '1px solid rgba(16, 185, 129, 0.4)', 
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Card Background Watermark */}
            <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.08, pointerEvents: 'none' }}>
              <Activity size={240} />
            </div>

            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6ee7b7', fontWeight: 800 }}>
                  PulseFIT Health Clubs
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  ALL-ACCESS VIP PASS
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)' }}>
                <Zap size={14} color="#10b981" />
                <span className="font-mono" style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>NFC ACTIVE</span>
              </div>
            </div>

            {/* Chip & Contactless Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
              <div style={{ width: '46px', height: '34px', borderRadius: '6px', background: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)', border: '1px solid #b45309', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4)' }} />
              <ScanLine size={24} color="#34d399" />
            </div>

            {/* Member Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em' }}>MEMBER NAME</span>
                <strong style={{ fontSize: '1.15rem', color: '#f8fafc', letterSpacing: '0.02em' }}>
                  {member?.name || 'Alex Mercer'}
                </strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>
                  Member ID: #0000{memberId} • Status: <span style={{ color: '#34d399', fontWeight: 700 }}>ACTIVE</span>
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em' }}>EXPIRES</span>
                <span className="font-mono" style={{ fontSize: '0.9rem', color: '#f1f5f9', fontWeight: 700 }}>
                  {subscription?.expiryDate || '2026-12-31'}
                </span>
              </div>
            </div>
          </div>

          {/* Turnstile Tap Console */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ScanLine size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Tap Pass at Turnstile Gate</h3>
              </div>
              <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>SIMULATED NFC TAP</span>
            </div>

            {/* Select Target Facility */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Select Entry Gate / Facility:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {facilities.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFacility(f)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '10px',
                      background: selectedFacility.id === f.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: selectedFacility.id === f.id ? '1px solid #10b981' : '1px solid var(--border-color)',
                      color: selectedFacility.id === f.id ? '#34d399' : 'var(--text-muted)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {f.name.replace('PulseFit ', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Tap Action Button */}
            <button
              onClick={handleTapGate}
              disabled={tapping}
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '1.05rem', fontWeight: 800, borderRadius: '14px', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)' }}
            >
              <ScanLine size={22} className={tapping ? 'animate-spin' : ''} />
              <span>{tapping ? 'Communicating with Turnstile (:8084)...' : `Tap Phone at ${selectedFacility.name}`}</span>
            </button>

            {/* Result Box */}
            {tapResult && (
              <div style={{
                marginTop: '18px',
                padding: '16px 20px',
                borderRadius: '12px',
                background: tapResult.granted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${tapResult.granted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {tapResult.granted ? <CheckCircle2 size={28} color="#10b981" /> : <XCircle size={28} color="#ef4444" />}
                  <div>
                    <strong style={{ display: 'block', color: tapResult.granted ? '#34d399' : '#f87171', fontSize: '0.95rem' }}>
                      {tapResult.granted ? 'ACCESS GRANTED • BARRIER OPENED' : 'ACCESS DENIED'}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {tapResult.message}
                    </span>
                  </div>
                </div>

                {activeCheckInId && (
                  <button onClick={handleCheckOut} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                    <LogOut size={16} />
                    <span>Check Out</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT: Subscription Details + Personal Attendance History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Subscription Info Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} color="#a78bfa" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Active Subscription Plan</h3>
              </div>
              <span className={`badge ${subscription?.currentlyValid ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.68rem' }}>
                {subscription?.currentlyValid ? 'ACTIVE & VALID' : 'EXPIRED'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Plan Type</span>
                <p style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-purple)', marginTop: '2px' }}>
                  {subscription?.planType || 'ALL_ACCESS_ANNUAL'}
                </p>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Facility Tier</span>
                <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                  {subscription?.facilityTier || 'MULTI_FACILITY'}
                </p>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Valid From</span>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  {subscription?.startDate || '2026-01-01'}
                </p>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Valid Until</span>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
                  {subscription?.expiryDate || '2026-12-31'}
                </p>
              </div>
            </div>

            <button
              onClick={handleQuickRenew}
              disabled={renewing}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '0.85rem', borderColor: 'rgba(16, 185, 129, 0.4)' }}
            >
              <Sparkles size={16} color="#10b981" />
              <span>{renewing ? 'Processing Renewal...' : 'Renew Subscription (+3 Months Extension)'}</span>
            </button>
          </div>

          {/* Personal Visit History */}
          <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#06b6d4" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>My Recent Gym Visits</h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Alex Mercer (ID #1)</span>
            </div>

            {history.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                No recent visits recorded yet. Tap the pass above to log your first workout!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                {history.map(item => (
                  <div key={item.attendanceId} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} color="var(--accent-cyan)" />
                        <strong style={{ fontSize: '0.85rem' }}>{item.facilityName || item.facilityId}</strong>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                        {new Date(item.checkInTime).toLocaleString()}
                      </span>
                    </div>
                    <span className={`badge ${item.accessStatus === 'GRANTED' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.65rem' }}>
                      {item.accessStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
