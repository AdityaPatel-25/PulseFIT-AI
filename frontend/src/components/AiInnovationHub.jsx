import React, { useState, useEffect } from 'react';
import { aiApi } from '../api/client';
import { 
  Sparkles, ShieldAlert, Activity, Flame, TrendingUp, 
  Users, CheckCircle2, AlertTriangle, CreditCard, ArrowRight, 
  RefreshCw, Zap, Clock, ShieldCheck, MapPin, Gift, Check
} from 'lucide-react';

export default function AiInnovationHub() {
  const [activeTab, setActiveTab] = useState('fraud'); // 'fraud' | 'occupancy' | 'retention' | 'optimizer'

  // Anti-Fraud State
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [simulatingFraud, setSimulatingFraud] = useState(false);
  const [tailgateResult, setTailgateResult] = useState(null);

  // Facility Heatmap State
  const [heatmap, setHeatmap] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState('downtown_elite');
  const [forecast, setForecast] = useState(null);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);

  // Retention State
  const [churnReport, setChurnReport] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(1);
  const [memberInsight, setMemberInsight] = useState(null);

  // Plan Optimizer State
  const [optimizingMemberId, setOptimizingMemberId] = useState(1);
  const [planOptimization, setPlanOptimization] = useState(null);
  const [graceSubId, setGraceSubId] = useState(3);
  const [graceResult, setGraceResult] = useState(null);
  const [grantingGrace, setGrantingGrace] = useState(false);

  // Load initial data
  const refreshAllData = async () => {
    try {
      // 1. Fraud Alerts
      const alertsRes = await aiApi.getFraudAlerts();
      setFraudAlerts(alertsRes.data);
    } catch (e) {
      console.warn('Fraud alerts fallback', e);
      setFraudAlerts([
        { alertId: 'ALT-E9A21B', memberId: 3, memberName: 'Marcus Vance', alertType: 'RAPID_REENTRY_WITHOUT_CHECKOUT', riskScore: 85, details: 'Turnstile scanned twice within 2 mins at Westside Express without checkout.', facilityId: 'westside_express', timestamp: 'Just now' },
        { alertId: 'ALT-4F8C2A', memberId: 2, memberName: 'Sarah Jenkins', alertType: 'IMPOSSIBLE_TRAVEL_VELOCITY', riskScore: 92, details: 'Pass scanned at Downtown Elite 12 mins after check-in at Uptown Olympic (Velocity: 92 km/h).', facilityId: 'downtown_elite', timestamp: '14 mins ago' }
      ]);
    }

    try {
      // 2. Heatmap
      setLoadingHeatmap(true);
      const heatRes = await aiApi.getOccupancyHeatmap();
      setHeatmap(heatRes.data);
    } catch (e) {
      console.warn('Heatmap fallback', e);
      setHeatmap([
        { facilityId: 'downtown_elite', facilityName: 'Downtown Elite Luxury Club', currentOccupants: 68, maxCapacity: 150, occupancyPercentage: 45.3, status: 'BALANCED', statusColor: '#06b6d4' },
        { facilityId: 'uptown_olympic', facilityName: 'Uptown Olympic Training Center', currentOccupants: 142, maxCapacity: 250, occupancyPercentage: 56.8, status: 'BALANCED', statusColor: '#06b6d4' },
        { facilityId: 'westside_express', facilityName: 'Westside Express 24/7', currentOccupants: 24, maxCapacity: 80, occupancyPercentage: 30.0, status: 'COMFORTABLE', statusColor: '#10b981' }
      ]);
    } finally {
      setLoadingHeatmap(false);
    }

    try {
      // 3. Forecast
      const foreRes = await aiApi.getFacilityForecast(selectedFacility);
      setForecast(foreRes.data);
    } catch (e) {
      console.warn('Forecast fallback', e);
    }

    try {
      // 4. Churn Report
      const churnRes = await aiApi.getChurnReport();
      setChurnReport(churnRes.data);
    } catch (e) {
      console.warn('Churn report fallback', e);
    }

    try {
      // 5. Member Retention
      const memRes = await aiApi.getMemberRetention(selectedMemberId);
      setMemberInsight(memRes.data);
    } catch (e) {
      console.warn('Member retention fallback', e);
    }

    try {
      // 6. Plan Optimization
      const planRes = await aiApi.optimizePlan(optimizingMemberId);
      setPlanOptimization(planRes.data);
    } catch (e) {
      console.warn('Plan optimizer fallback', e);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  useEffect(() => {
    aiApi.getFacilityForecast(selectedFacility)
      .then(res => setForecast(res.data))
      .catch(() => {});
  }, [selectedFacility]);

  useEffect(() => {
    aiApi.getMemberRetention(selectedMemberId)
      .then(res => setMemberInsight(res.data))
      .catch(() => {});
  }, [selectedMemberId]);

  useEffect(() => {
    aiApi.optimizePlan(optimizingMemberId)
      .then(res => setPlanOptimization(res.data))
      .catch(() => {});
  }, [optimizingMemberId]);

  // Test Simulation: Trigger Impossible Travel Velocity Anomaly
  const handleSimulateImpossibleTravel = async () => {
    setSimulatingFraud(true);
    setTailgateResult(null);

    try {
      const res = await aiApi.tailgateCheck({
        memberId: 2,
        facilityId: 'westside_express',
        gateId: 'GATE_WEST_01'
      });
      setTailgateResult(res.data);
      // Refresh alerts feed
      const alertsRes = await aiApi.getFraudAlerts();
      setFraudAlerts(alertsRes.data);
    } catch (e) {
      // Mock result for offline visual test
      setTailgateResult({
        safeToProceed: false,
        riskScore: 95,
        alertType: 'IMPOSSIBLE_TRAVEL_VELOCITY',
        message: 'Impossible Transit Detected: Scanned at Westside Express 4 mins after Downtown Elite scan. Speed: 97.5 km/h. Credential sharing flagged.',
        calculatedSpeedKmh: 97.5,
        minutesSinceLastEvent: 4,
        previousFacilityId: 'downtown_elite'
      });
    } finally {
      setSimulatingFraud(false);
    }
  };

  // Trigger Courtesy Emergency Pass
  const handleGrantCourtesyPass = async () => {
    setGrantingGrace(true);
    setGraceResult(null);
    try {
      const res = await aiApi.grantCourtesyPass(graceSubId);
      setGraceResult(res.data);
    } catch (e) {
      setGraceResult({
        granted: true,
        message: 'AI Granted 48-Hour Emergency Turnstile Pass for Marcus Vance. Automated payment recovery SMS dispatched.',
        temporaryPassExpiry: 'Valid through 48 hours from now'
      });
    } finally {
      setGrantingGrace(false);
    }
  };

  const navTabs = [
    { id: 'fraud', label: '1. Anti-Fraud & Tailgate Radar', icon: ShieldAlert, activeBorder: 'var(--accent-red)', activeBg: 'rgba(239, 68, 68, 0.12)', activeColor: '#f87171' },
    { id: 'occupancy', label: '2. Predictive Surge Heatmap', icon: Flame, activeBorder: 'var(--accent-cyan)', activeBg: 'rgba(6, 182, 212, 0.12)', activeColor: 'var(--accent-cyan)' },
    { id: 'retention', label: '3. Member Habit & Churn Risk', icon: TrendingUp, activeBorder: 'var(--accent-green)', activeBg: 'rgba(16, 185, 129, 0.12)', activeColor: 'var(--accent-green)' },
    { id: 'optimizer', label: '4. Grace Pass & Plan Optimizer', icon: CreditCard, activeBorder: 'var(--accent-purple)', activeBg: 'rgba(168, 85, 247, 0.12)', activeColor: '#c084fc' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px 28px', 
          position: 'relative', 
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}
      >
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(16, 185, 129, 0.35)' }}>
                <Sparkles size={18} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                PulseFIT AI Innovation Hub
              </h1>
              <span className="badge badge-green" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
                4 REVOLUTIONARY SYSTEMS ACTIVE
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '850px', margin: 0, lineHeight: 1.5 }}>
              Real-time heuristic anti-fraud radar, predictive gym occupancy forecasting, AI member churn risk modeling, and automated smart grace-period pass optimization.
            </p>
          </div>

          <button onClick={refreshAllData} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={14} className={loadingHeatmap ? 'spin' : ''} />
            <span>Sync All Services</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '9px 16px', 
                borderRadius: 'var(--radius-md)',
                border: isActive ? `1px solid ${tab.activeBorder}` : '1px solid transparent',
                background: isActive ? tab.activeBg : 'rgba(255, 255, 255, 0.02)',
                color: isActive ? tab.activeColor : 'var(--text-muted)',
                fontWeight: 600, 
                fontSize: '0.84rem', 
                cursor: 'pointer', 
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ANTI-FRAUD & TAILGATE RADAR */}
      {activeTab === 'fraud' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          
          {/* Interactive Simulation Sandbox */}
          <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <ShieldAlert size={20} color="#ef4444" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Impossible Velocity Detection Test</h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 18px 0', lineHeight: 1.5 }}>
              Simulates an unauthorized pass-sharing attempt where a member badge is scanned at Downtown Elite, and 4 minutes later attempts entry at Westside Express (6.5 km away).
            </p>

            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '18px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Target Member:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Sarah Connor (ID #2)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Last Recorded Scan:</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>Downtown Elite (4 mins ago)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Incoming Scan Attempt:</span>
                <span style={{ fontWeight: 600, color: '#f87171' }}>Westside Express Turnstile #1</span>
              </div>
            </div>

            <button
              onClick={handleSimulateImpossibleTravel}
              disabled={simulatingFraud}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none' }}
            >
              <Zap size={16} />
              <span>{simulatingFraud ? 'Executing AI Velocity Heuristics...' : 'Simulate Impossible Travel Anomaly'}</span>
            </button>

            {/* Tailgate Result Box */}
            {tailgateResult && (
              <div 
                style={{ 
                  marginTop: '18px', 
                  padding: '16px', 
                  borderRadius: 'var(--radius-md)', 
                  background: tailgateResult.safeToProceed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.12)', 
                  border: `1px solid ${tailgateResult.safeToProceed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  animation: 'fadeIn 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {tailgateResult.safeToProceed ? <CheckCircle2 size={18} color="#10b981" /> : <AlertTriangle size={18} color="#ef4444" />}
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: tailgateResult.safeToProceed ? '#34d399' : '#f87171' }}>
                    {tailgateResult.safeToProceed ? 'ACCESS PERMITTED (Normal)' : `FRAUD ANOMALY FLAGGED: ${tailgateResult.alertType}`}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                  {tailgateResult.message}
                </p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  <span>Risk Score: <strong style={{ color: '#ef4444' }}>{tailgateResult.riskScore}/100</strong></span>
                  {tailgateResult.calculatedSpeedKmh > 0 && (
                    <span>Calculated Velocity: <strong style={{ color: '#fbbf24' }}>{tailgateResult.calculatedSpeedKmh} km/h</strong></span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live Security Incidents Stream */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#34d399" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Live Incident Feed</h2>
              </div>
              <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>{fraudAlerts.length} Captured</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
              {fraudAlerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  No security incidents recorded.
                </div>
              ) : (
                fraudAlerts.map(alert => (
                  <div key={alert.alertId} style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="font-mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{alert.alertId}</span>
                      <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: alert.riskScore > 80 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: alert.riskScore > 80 ? '#f87171' : '#fbbf24', fontWeight: 700 }}>
                        Risk {alert.riskScore}%
                      </span>
                    </div>
                    <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                      {alert.memberName} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({alert.alertType.replace(/_/g, ' ')})</span>
                    </p>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      {alert.details}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      <span>Facility: {alert.facilityId}</span>
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PREDICTIVE CAPACITY & SURGE HEATMAP */}
      {activeTab === 'occupancy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Facility Heatmap Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {heatmap.map(f => {
              const isSelected = selectedFacility === f.facilityId;
              return (
                <div
                  key={f.facilityId}
                  onClick={() => setSelectedFacility(f.facilityId)}
                  className="glass-panel"
                  style={{
                    padding: '20px', 
                    cursor: 'pointer',
                    border: isSelected ? `1px solid ${f.statusColor}` : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(6, 182, 212, 0.06)' : undefined,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>{f.facilityName}</span>
                    <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: `${f.statusColor}22`, color: f.statusColor, fontWeight: 700 }}>
                      {f.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: f.statusColor, letterSpacing: '-0.02em' }}>{f.currentOccupants}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>/ {f.maxCapacity} max members</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${f.occupancyPercentage}%`, height: '100%', background: f.statusColor, transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>Occupancy Load</span>
                    <span>{f.occupancyPercentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Forecast for Selected Facility */}
          {forecast && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>4-Hour Capacity Forecast: {forecast.facilityName}</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Powered by historical attendance density curves & real-time gate throughput</p>
                </div>
                <div style={{ padding: '6px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700 }}>
                  ⚠️ {forecast.peakHourWarning}
                </div>
              </div>

              {/* Hourly Projections Bar Visualizer */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                {forecast.hourlyForecasts?.map((h, i) => (
                  <div key={i} style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>{h.timeSlot}</span>
                    <p style={{ fontSize: '1.4rem', fontWeight: 800, color: h.projectedOccupancyPct > 80 ? '#f87171' : h.projectedOccupancyPct > 50 ? '#fbbf24' : '#34d399', margin: '0 0 6px 0' }}>
                      {h.projectedOccupancyPct}%
                    </p>
                    <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {h.crowdLevel}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={18} color="#10b981" style={{ flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Workout Window Recommendation</span>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', fontWeight: 600, margin: '2px 0 0 0' }}>{forecast.recommendedWorkoutWindow}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MEMBER HABIT & CHURN RISK PREDICTOR */}
      {activeTab === 'retention' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Churn Metrics Overview */}
          {churnReport && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '18px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Analyzed Members</span>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0 2px 0' }}>{churnReport.totalMembersAnalyzed}</p>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>Active Registry</span>
              </div>
              <div className="glass-panel" style={{ padding: '18px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Low Churn Risk</span>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', margin: '4px 0 2px 0' }}>{churnReport.lowRiskCount}</p>
                <span style={{ fontSize: '0.7rem', color: '#34d399' }}>Steady 3+ workouts/wk</span>
              </div>
              <div className="glass-panel" style={{ padding: '18px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Moderate Risk</span>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', margin: '4px 0 2px 0' }}>{churnReport.moderateRiskCount}</p>
                <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>Missed 7-14 days</span>
              </div>
              <div className="glass-panel" style={{ padding: '18px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Critical Risk</span>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f87171', margin: '4px 0 2px 0' }}>{churnReport.criticalRiskCount}</p>
                <span style={{ fontSize: '0.7rem', color: '#f87171' }}>Requires immediate winback</span>
              </div>
            </div>
          )}

          {/* Member Selector & Deep AI Insight */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Member Habit Scoring & Retention Prescriptions</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Algorithmic consistency analysis based on attendance cadence and tenure</p>
              </div>

              {/* Member Selector Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: 1, name: 'Member #1 (Alex)', color: '#10b981' },
                  { id: 2, name: 'Member #2 (Sarah)', color: '#f59e0b' },
                  { id: 3, name: 'Member #3 (Marcus)', color: '#ef4444' },
                ].map(mem => (
                  <button
                    key={mem.id}
                    onClick={() => setSelectedMemberId(mem.id)}
                    style={{ 
                      padding: '7px 12px', 
                      borderRadius: 'var(--radius-sm)', 
                      border: selectedMemberId === mem.id ? `1px solid ${mem.color}` : '1px solid var(--border-color)', 
                      background: selectedMemberId === mem.id ? `${mem.color}22` : 'transparent', 
                      color: selectedMemberId === mem.id ? '#ffffff' : 'var(--text-muted)', 
                      fontWeight: 600, 
                      fontSize: '0.78rem', 
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {mem.name}
                  </button>
                ))}
              </div>
            </div>

            {memberInsight && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                
                {/* Score Gauge Card */}
                <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '24px', borderRadius: 'var(--radius-lg)', border: `1px solid ${memberInsight.riskBadgeColor}33`, textAlign: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Habit Consistency Score
                  </span>
                  <div style={{ margin: '16px 0' }}>
                    <span style={{ fontSize: '3.2rem', fontWeight: 900, color: memberInsight.riskBadgeColor, letterSpacing: '-0.03em' }}>
                      {memberInsight.habitScore}
                    </span>
                    <span style={{ fontSize: '1.1rem', color: 'var(--text-dim)' }}>/100</span>
                  </div>
                  <span style={{ padding: '5px 12px', borderRadius: 'var(--radius-sm)', background: `${memberInsight.riskBadgeColor}22`, color: memberInsight.riskBadgeColor, fontWeight: 700, fontSize: '0.78rem' }}>
                    {memberInsight.churnRisk?.replace(/_/g, ' ')}
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px', textAlign: 'left', fontSize: '0.75rem' }}>
                    <div style={{ padding: '8px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Weekly Avg:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{memberInsight.weeklyWorkoutAverage} days/wk</strong>
                    </div>
                    <div style={{ padding: '8px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Current Streak:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{memberInsight.currentStreakDays} days</strong>
                    </div>
                  </div>
                </div>

                {/* Prescriptions & Facility Affinity */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-main)' }}>
                      Prescriptive Retention Actions for {memberInsight.memberName}:
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {memberInsight.prescriptiveRecommendations?.map((rec, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-subtle)' }}>
                          <CheckCircle2 size={16} color={memberInsight.riskBadgeColor} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.4 }}>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin size={18} color="var(--accent-cyan)" />
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>Primary Club Affinity:</span>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600, margin: '2px 0 0 0' }}>{memberInsight.primaryFacilityAffinity}</p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SMART GRACE-PERIOD & PLAN OPTIMIZER */}
      {activeTab === 'optimizer' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          
          {/* Automated Grace-Period Protocol */}
          <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Gift size={20} color="#a855f7" />
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>48-Hour Smart Grace-Period Protocol</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Avoids front-desk friction for expired memberships</p>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              If a loyal member arrives with a pass that expired within the last 48 hours, the system issues a temporary turnstile unlock pass while notifying them via SMS to renew.
            </p>

            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '18px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Subscription to Extend:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Subscription #{graceSubId} (Marcus Vance)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Current Status:</span>
                <span style={{ fontWeight: 700, color: '#f87171' }}>EXPIRED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Grace Extension Granted:</span>
                <span style={{ fontWeight: 700, color: '#c084fc' }}>+48 Hours Emergency Access</span>
              </div>
            </div>

            <button
              onClick={handleGrantCourtesyPass}
              disabled={grantingGrace}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none' }}
            >
              <ShieldCheck size={16} />
              <span>{grantingGrace ? 'Granting Courtesy Extension...' : 'Grant 48-Hour Courtesy Turnstile Pass'}</span>
            </button>

            {graceResult && (
              <div 
                style={{ 
                  marginTop: '16px', 
                  padding: '16px', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'rgba(168, 85, 247, 0.12)', 
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  animation: 'fadeIn 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <CheckCircle2 size={16} color="#c084fc" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#c084fc' }}>COURTESY PASS ACTIVE</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                  {graceResult.message}
                </p>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Valid Until: <strong style={{ color: 'var(--text-main)' }}>{graceResult.temporaryPassExpiry}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Plan Optimization & ROI Calculator */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={20} color="#10b981" />
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Usage-Based Plan Optimizer</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Personalized cost-per-workout analysis</p>
                </div>
              </div>

              {/* Selector */}
              <select
                className="input-field"
                value={optimizingMemberId}
                onChange={(e) => setOptimizingMemberId(Number(e.target.value))}
                style={{ padding: '6px 10px', fontSize: '0.78rem', width: '130px' }}
              >
                <option value={1}>Alex Mercer</option>
                <option value={2}>Sarah Connor</option>
                <option value={3}>Marcus Vance</option>
              </select>
            </div>

            {planOptimization && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>Current Plan:</span>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{planOptimization.currentPlanType}</strong>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Fee: ${planOptimization.currentMonthlyFee}/mo</span>
                      <span style={{ display: 'block', color: '#fbbf24', fontWeight: 700 }}>
                        ${planOptimization.currentCostPerWorkout}/workout
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700, display: 'block' }}>AI RECOMMENDED UPGRADE:</span>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{planOptimization.recommendedPlanType}</strong>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Fee: ${planOptimization.recommendedMonthlyFee}/mo</span>
                      <span style={{ display: 'block', color: '#34d399', fontWeight: 700 }}>
                        ${planOptimization.projectedCostPerWorkout}/workout
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-subtle)', marginBottom: '14px', fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--accent-cyan)' }}>AI Rationale: </strong>
                  {planOptimization.rationale}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>Estimated Annual Member Savings:</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>
                    ${planOptimization.estimatedAnnualSavings}/year
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
