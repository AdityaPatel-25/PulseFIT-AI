import React, { useState } from 'react';
import { attendanceApi } from '../api/client';
import { soundFX } from '../utils/audio';
import { 
  ScanLine, CheckCircle2, XCircle, Clock, MapPin, Zap, LogOut, 
  ArrowRight, ShieldCheck, AlertTriangle, Volume2, VolumeX, 
  CreditCard, Sparkles, UserCheck, Flame, ChevronRight
} from 'lucide-react';

export default function TurnstileSimulator({ onCheckInSuccess }) {
  const [memberId, setMemberId] = useState(1);
  const [facilityId, setFacilityId] = useState('FACILITY_DOWNTOWN');
  const [facilityName, setFacilityName] = useState('PulseFit Downtown Elite');
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [latency, setLatency] = useState(null);
  const [activeCheckInId, setActiveCheckInId] = useState(null);
  const [checkoutMessage, setCheckoutMessage] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [swipingCard, setSwipingCard] = useState(false);

  const facilities = [
    { 
      id: 'FACILITY_DOWNTOWN', 
      name: 'PulseFit Downtown Elite', 
      tier: 'All-Access VIP', 
      occupancy: 94, 
      capacity: 150,
      image: '🏙️ Downtown Financial District'
    },
    { 
      id: 'FACILITY_UPTOWN', 
      name: 'PulseFit Uptown Olympic', 
      tier: 'Olympic Multi-Facility', 
      occupancy: 68, 
      capacity: 200,
      image: '🏊 Olympic Pool & Spa'
    },
    { 
      id: 'FACILITY_WESTSIDE', 
      name: 'PulseFit Westside Express', 
      tier: 'Express Studio', 
      occupancy: 42, 
      capacity: 80,
      image: '⚡ High-Intensity Studio'
    },
  ];

  const currentFacility = facilities.find(f => f.id === facilityId) || facilities[0];

  const testMembers = [
    { 
      id: 1, 
      name: 'Alex Mercer', 
      plan: 'All-Access VIP (Annual)', 
      expected: 'GRANTED', 
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
      badgeColor: '#10b981',
      desc: 'Active subscription expiring in 10 months'
    },
    { 
      id: 2, 
      name: 'Sarah Connor', 
      plan: 'Premium Multi-Club (Quarterly)', 
      expected: 'GRANTED', 
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
      badgeColor: '#10b981',
      desc: 'Active subscription expiring in 2 months'
    },
    { 
      id: 3, 
      name: 'Marcus Vance', 
      plan: 'Basic Monthly (EXPIRED)', 
      expected: 'DENIED', 
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
      badgeColor: '#ef4444',
      desc: 'Plan expired 5 days ago — access should be blocked'
    },
  ];

  const activeMemberCard = testMembers.find(m => m.id === Number(memberId)) || {
    id: memberId,
    name: `Member #${memberId}`,
    plan: 'Custom Membership Card',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    badgeColor: '#06b6d4',
    desc: 'Custom Member ID lookup'
  };

  const executeCheckIn = async (targetId) => {
    const idToUse = targetId || memberId;
    setScanning(true);
    setSwipingCard(true);
    setLastResult(null);
    setCheckoutMessage(null);

    if (soundEnabled) {
      soundFX.playScanClick();
    }

    const startTime = performance.now();

    try {
      const response = await attendanceApi.checkIn({
        memberId: Number(idToUse),
        facilityId: facilityId,
        facilityName: facilityName,
      });

      const duration = Math.round(performance.now() - startTime);
      setLatency(duration);
      setLastResult(response.data);

      if (response.data.granted) {
        if (soundEnabled) soundFX.playGranted();
        setActiveCheckInId(response.data.attendanceId);
        if (onCheckInSuccess) onCheckInSuccess();
      } else {
        if (soundEnabled) soundFX.playDenied();
      }
    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      setLatency(duration);
      if (soundEnabled) soundFX.playDenied();

      if (err.response && err.response.data) {
        setLastResult(err.response.data);
      } else {
        setLastResult({
          granted: false,
          memberId: Number(idToUse),
          facilityId: facilityId,
          message: 'Network Error: Cannot connect to API Gateway (:8080)',
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      setScanning(false);
      setTimeout(() => setSwipingCard(false), 600);
    }
  };

  const executeCheckOut = async () => {
    if (!lastResult || !lastResult.memberId) return;
    try {
      await attendanceApi.checkOut({
        memberId: lastResult.memberId,
        attendanceId: activeCheckInId,
      });
      setCheckoutMessage(`Visit concluded! Workout duration has been logged in Attendance Service.`);
      setActiveCheckInId(null);
      if (soundEnabled) soundFX.playGranted();
      if (onCheckInSuccess) onCheckInSuccess();
    } catch (err) {
      setCheckoutMessage(err.response?.data?.error || 'Check-out failed');
    }
  };

  const isGateOpen = lastResult && lastResult.granted;
  const occupancyPercent = Math.round((currentFacility.occupancy / currentFacility.capacity) * 100);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '28px' }}>
      
      {/* LEFT COLUMN: Physical Turnstile Hardware & Animated Gate */}
      <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Header with Sound Toggle */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>IoT Hardware Simulation</span>
              <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>Spring Cloud Feign Mesh</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>Turnstile Access Terminal</h2>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="btn btn-secondary"
            title={soundEnabled ? 'Mute Audio Chimes' : 'Enable Audio Chimes'}
            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
          >
            {soundEnabled ? <Volume2 size={16} color="#10b981" /> : <VolumeX size={16} color="#9ca3af" />}
            <span>{soundEnabled ? 'Audio FX: ON' : 'Audio: OFF'}</span>
          </button>
        </div>

        {/* Turnstile Cabinet Hardware */}
        <div style={{ width: '100%', maxWidth: '520px', background: '#080d19', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', position: 'relative' }}>
          
          {/* LCD High-Contrast Gate Terminal Screen */}
          <div style={{ 
            background: '#020617', 
            borderRadius: '16px', 
            padding: '18px 24px', 
            border: `2px solid ${isGateOpen ? '#10b981' : lastResult && !lastResult.granted ? '#ef4444' : '#1e293b'}`, 
            marginBottom: '28px', 
            textAlign: 'center', 
            minHeight: '100px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            boxShadow: isGateOpen ? '0 0 25px rgba(16, 185, 129, 0.3)' : lastResult && !lastResult.granted ? '0 0 25px rgba(239, 68, 68, 0.3)' : 'none',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>
                {facilityName.toUpperCase()}
              </span>
              <span className="font-mono" style={{ fontSize: '0.7rem', color: '#06b6d4' }}>
                GATE #01-A
              </span>
            </div>

            {scanning ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <Zap size={22} color="#38bdf8" className="animate-pulse-glow" />
                <p style={{ color: '#38bdf8', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.02em' }}>
                  CALLING FEIGN MESH... VERIFYING PASS
                </p>
              </div>
            ) : lastResult ? (
              <div>
                <p style={{ color: lastResult.granted ? '#34d399' : '#f87171', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                  {lastResult.message}
                </p>
                {lastResult.granted && (
                  <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                    ✔ Subscription Verified • Barrier Opened for 10s
                  </span>
                )}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.95rem' }}>
                PLEASE SWIPE OR TAP RFID ACCESS PASS
              </p>
            )}
          </div>

          {/* Turnstile Mechanism Graphic */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '200px', padding: '0 24px', position: 'relative' }}>
            
            {/* Left Stanchion / Terminal */}
            <div style={{ width: '80px', height: '180px', background: 'linear-gradient(to bottom right, #1e293b, #0f172a)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 10px 30px rgba(0,0,0,0.7)' }}>
              
              {/* LED Beacon Light */}
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: isGateOpen ? '#10b981' : '#ef4444',
                boxShadow: isGateOpen ? '0 0 20px #10b981, 0 0 40px #10b981' : '0 0 16px #ef4444',
                border: '2px solid rgba(255,255,255,0.4)',
                transition: 'all 0.3s ease'
              }} />

              {/* RFID Sensor Pad (With Swiping Motion) */}
              <div 
                onClick={() => executeCheckIn(memberId)}
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '12px', 
                  background: swipingCard ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0,0,0,0.5)', 
                  border: swipingCard ? '2px solid #38bdf8' : '1px dashed rgba(255,255,255,0.25)', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transform: swipingCard ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}
                title="Click to tap card on RFID sensor"
              >
                <ScanLine size={26} color={swipingCard ? '#38bdf8' : '#9ca3af'} />
                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-dim)', marginTop: '2px' }}>NFC TAP</span>
              </div>

              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)' }}>STANCHION-A</span>
            </div>

            {/* Central Rotating Barrier Arm Mechanism */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '100%' }}>
              
              {/* Turnstile Rotating Barrier Arm */}
              <div 
                className={`turnstile-arm ${isGateOpen ? 'open' : 'closed'}`}
                style={{
                  width: '170px',
                  height: '16px',
                  background: isGateOpen 
                    ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' 
                    : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                  borderRadius: '8px',
                  boxShadow: isGateOpen ? '0 0 25px rgba(16, 185, 129, 0.7)' : '0 0 20px rgba(239, 68, 68, 0.5)',
                  position: 'absolute',
                  left: '12px',
                  zIndex: 5
                }}
              />

              {/* High-Tech Central Hub / Rotor */}
              <div style={{ 
                zIndex: 10, 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: '#090d16', 
                border: `3px solid ${isGateOpen ? '#10b981' : '#374151'}`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
              }}>
                {isGateOpen ? (
                  <CheckCircle2 size={34} color="#10b981" />
                ) : (
                  <XCircle size={34} color={lastResult && !lastResult.granted ? '#ef4444' : '#64748b'} />
                )}
              </div>
            </div>

            {/* Right Stanchion / Exit Sensor */}
            <div style={{ width: '80px', height: '180px', background: 'linear-gradient(to bottom left, #1e293b, #0f172a)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 10px 30px rgba(0,0,0,0.7)' }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: isGateOpen ? '#10b981' : '#ef4444',
                boxShadow: isGateOpen ? '0 0 20px #10b981, 0 0 40px #10b981' : '0 0 16px #ef4444',
                border: '2px solid rgba(255,255,255,0.4)',
                transition: 'all 0.3s ease'
              }} />

              <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.3 }}>
                <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>OPTICAL</span><br />
                BARRIER<br />
                SENSOR
              </div>

              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)' }}>STANCHION-B</span>
            </div>

          </div>

          {/* Real-time Turnstile Telemetry Bar */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.68rem' }}>TURNSTILE LATENCY</span>
              <strong style={{ color: '#f3f4f6', fontSize: '0.85rem' }}>{latency !== null ? `${latency} ms` : '—'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.68rem' }}>SECURITY PERIMETER</span>
              <strong style={{ color: '#34d399', fontSize: '0.85rem' }}>API Gateway JWT</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.68rem' }}>INTER-SERVICE MESH</span>
              <strong style={{ color: '#38bdf8', fontSize: '0.85rem' }}>OpenFeign OK</strong>
            </div>
          </div>

        </div>

        {/* Check-Out Station Banner (Appears when someone checked in) */}
        {isGateOpen && (
          <div style={{ width: '100%', maxWidth: '520px', marginTop: '20px', padding: '16px 20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#34d399' }}>Workout Session Active</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Member {lastResult.memberName} (ID #{lastResult.memberId}) is inside {facilityName}.
              </p>
            </div>
            <button onClick={executeCheckOut} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
              <LogOut size={16} />
              <span>Swipe Check-Out</span>
            </button>
          </div>
        )}

        {checkoutMessage && (
          <p style={{ marginTop: '14px', fontSize: '0.82rem', color: '#38bdf8', fontWeight: 600 }}>
            {checkoutMessage}
          </p>
        )}

      </div>

      {/* RIGHT COLUMN: Interactive RFID Keycard & Facility Switcher */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Facility Card & Live Capacity Bar */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="#06b6d4" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Facility Gate Selector</h3>
            </div>
            <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>{currentFacility.tier}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {facilities.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFacilityId(f.id);
                  setFacilityName(f.name);
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: facilityId === f.id ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  border: facilityId === f.id ? '1px solid #06b6d4' : '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.92rem' }}>{f.name}</p>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{f.image}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8' }}>
                    {f.occupancy} / {f.capacity}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-dim)' }}>inside</span>
                </div>
              </button>
            ))}
          </div>

          {/* Facility Capacity Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
              <span>Live Hall Occupancy</span>
              <strong>{occupancyPercent}% capacity</strong>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${occupancyPercent}%`, 
                background: occupancyPercent > 80 ? '#ef4444' : occupancyPercent > 50 ? '#f59e0b' : '#10b981',
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Digital RFID Access Pass Visualizer */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '6px' }}>Digital RFID Access Pass</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Select a test member card to swipe at the physical turnstile:
          </p>

          {/* 3 Interactive Member Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {testMembers.map((m) => {
              const isSelected = Number(memberId) === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setMemberId(m.id)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1px solid #10b981' : '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={m.avatar} 
                      alt={m.name} 
                      style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} 
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '0.92rem' }}>{m.name}</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>ID #{m.id}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{m.plan}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge ${m.expected === 'GRANTED' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.65rem' }}>
                      {m.expected}
                    </span>
                    <button
                      type="button"
                      disabled={scanning}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMemberId(m.id);
                        executeCheckIn(m.id);
                      }}
                      className="btn btn-primary"
                      style={{ padding: '7px 14px', fontSize: '0.78rem' }}
                    >
                      <span>Swipe</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manual Member ID Input */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Or Swipe Custom Member ID:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                min="1"
                className="input-field"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="Enter member ID..."
                style={{ width: '130px' }}
              />
              <button
                disabled={scanning}
                onClick={() => executeCheckIn(memberId)}
                className="btn btn-accent"
                style={{ flex: 1 }}
              >
                <ScanLine size={16} />
                <span>{scanning ? 'Verifying...' : 'Swipe Turnstile'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
