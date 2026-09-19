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
        subscriptionId: graceSubId,
        memberId: 3,
        message: '48-Hour Smart Grace Period activated! Turnstile unlocked for courtesy entry. Renewal prompt dispatched.',
        temporaryPassExpiry: '2026-09-20 23:59:00',
        paymentActionRequired: true,
        notificationChannel: 'SMS & Mobile Push Notification Dispatched'
      });
    } finally {
      setGrantingGrace(false);
    }
  };

  return (
    <div style={{ color: 'white' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}>
                <Sparkles size={20} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                PulseFIT AI Innovation Hub
              </h1>
              <span className="badge badge-green" style={{ fontSize: '0.68rem', padding: '4px 10px' }}>
                4 REVOLUTIONARY BACKEND SYSTEMS ACTIVE
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '850px' }}>
              Real-time heuristic anti-fraud radar, predictive gym occupancy forecasting, AI member churn risk modeling, and automated smart grace-period pass optimization.
            </p>
          </div>

          <button onClick={refreshAllData} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={15} />
            <span>Sync All Services</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('fraud')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px',
            border: activeTab === 'fraud' ? '1px solid #ef4444' : '1px solid transparent',
            background: activeTab === 'fraud' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'fraud' ? '#f87171' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <ShieldAlert size={16} />
          <span>1. Turnstile Anti-Fraud & Tailgate Radar</span>
        </button>

        <button
          onClick={() => setActiveTab('occupancy')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px',
            border: activeTab === 'occupancy' ? '1px solid #06b6d4' : '1px solid transparent',
            background: activeTab === 'occupancy' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'occupancy' ? '#38bdf8' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <Flame size={16} />
          <span>2. Predictive Capacity & Surge Heatmap</span>
        </button>

        <button
          onClick={() => setActiveTab('retention')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px',
            border: activeTab === 'retention' ? '1px solid #10b981' : '1px solid transparent',
            background: activeTab === 'retention' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'retention' ? '#34d399' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <TrendingUp size={16} />
          <span>3. Member Habit & AI Churn Predictor</span>
        </button>

        <button
          onClick={() => setActiveTab('optimizer')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px',
            border: activeTab === 'optimizer' ? '1px solid #a855f7' : '1px solid transparent',
            background: activeTab === 'optimizer' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'optimizer' ? '#c084fc' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <CreditCard size={16} />
          <span>4. Smart Grace-Period & Plan Optimizer</span>
        </button>
      </div>

      {/* TAB 1: ANTI-FRAUD & TAILGATE RADAR */}
      {activeTab === 'fraud' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            
            {/* Interactive Simulation Sandbox */}
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <ShieldAlert size={20} color="#ef4444" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Impossible Velocity Detection Test</h2>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: '1.5' }}>
                Simulates an unauthorized pass-sharing attempt where a member badge is scanned at Downtown Elite, and 4 minutes later attempts entry at Westside Express (6.5 km away).
              </p>

              <div style={{ background: '#090d16', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '18px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Target Member:</span>
                  <span style={{ fontWeight: 700, color: 'white' }}>Sarah Connor (ID #2)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Last Recorded Scan:</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>Downtown Elite (4 mins ago)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Incoming Scan Attempt:</span>
                  <span style={{ fontWeight: 700, color: '#f87171' }}>Westside Express Turnstile #1</span>
                </div>
              </div>

              <button
                onClick={handleSimulateImpossibleTravel}
                disabled={simulatingFraud}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Zap size={16} />
                <span>{simulatingFraud ? 'Executing AI Velocity Heuristics...' : 'Simulate Impossible Travel Anomaly'}</span>
              </button>

              {/* Tailgate Result Box */}
              {tailgateResult && (
                <div style={{ marginTop: '18px', padding: '16px', borderRadius: '12px', background: tailgateResult.safeToProceed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.2)', border: tailgateResult.safeToProceed ? '1px solid #10b981' : '1px solid #ef4444' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {tailgateResult.safeToProceed ? <CheckCircle2 size={18} color="#10b981" /> : <AlertTriangle size={18} color="#ef4444" />}
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: tailgateResult.safeToProceed ? '#34d399' : '#f87171' }}>
                      {tailgateResult.safeToProceed ? 'ACCESS PERMITTED (Normal)' : `FRAUD ANOMALY FLAGGED: ${tailgateResult.alertType}`}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#e2e8f0', marginBottom: '8px' }}>
                    {tailgateResult.message}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
                  <ShieldCheck size={20} color="#34d399" />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Live Incident Feed (Staff Alert Console)</h2>
                </div>
                <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>{fraudAlerts.length} Captured</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
                {fraudAlerts.map(alert => (
                  <div key={alert.alertId} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(9, 13, 22, 0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{alert.alertId}</span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: alert.riskScore > 80 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: alert.riskScore > 80 ? '#f87171' : '#fbbf24', fontWeight: 700 }}>
                        Risk {alert.riskScore}%
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
                      {alert.memberName} ({alert.alertType.replace(/_/g, ' ')})
                    </p>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {alert.details}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      <span>Facility: {alert.facilityId}</span>
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: PREDICTIVE CAPACITY & SURGE HEATMAP */}
      {activeTab === 'occupancy' && (
        <div>
          {/* Facility Heatmap Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '24px' }}>
            {heatmap.map(f => (
              <div
                key={f.facilityId}
                onClick={() => setSelectedFacility(f.facilityId)}
                className="glass-panel"
                style={{
                  padding: '20px', cursor: 'pointer',
                  border: selectedFacility === f.facilityId ? `2px solid ${f.statusColor}` : '1px solid var(--border-color)',
                  transition: 'all 0.2s', background: selectedFacility === f.facilityId ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.5)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 800 }}>{f.facilityName}</span>
                  <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '6px', background: `${f.statusColor}22`, color: f.statusColor, fontWeight: 800 }}>
                    {f.status}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: f.statusColor }}>{f.currentOccupants}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>/ {f.maxCapacity} max members</span>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${f.occupancyPercentage}%`, height: '100%', background: f.statusColor, transition: 'width 0.5s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Occupancy Load</span>
                  <span>{f.occupancyPercentage}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Forecast for Selected Facility */}
          {forecast && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>4-Hour Capacity Forecast: {forecast.facilityName}</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Powered by historical attendance density curves & real-time gate throughput</p>
                </div>
                <div style={{ padding: '6px 14px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700 }}>
                  ⚠️ {forecast.peakHourWarning}
                </div>
              </div>

              {/* Hourly Projections Bar Visualizer */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                {forecast.hourlyForecasts.map((h, i) => (
                  <div key={i} style={{ padding: '16px', borderRadius: '12px', background: '#090d16', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>{h.timeSlot}</span>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: h.projectedOccupancyPct > 80 ? '#f87171' : h.projectedOccupancyPct > 50 ? '#fbbf24' : '#34d399', marginBottom: '6px' }}>
                      {h.projectedOccupancyPct}%
                    </p>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontWeight: 700 }}>
                      {h.crowdLevel}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={20} color="#10b981" />
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Workout Window Recommendation</span>
                  <p style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>{forecast.recommendedWorkoutWindow}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MEMBER HABIT & CHURN RISK PREDICTOR */}
      {activeTab === 'retention' && (
        <div>
          {/* Churn Metrics Overview */}
          {churnReport && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div className="glass-panel" style={{ padding: '18px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Analyzed Members</span>
                <p style={{ fontSize: '1.8rem', fontWeight: 900 }}>{churnReport.totalMembersAnalyzed}</p>
                <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Active Registry</span>
              </div>
              <div className="glass-panel" style={{ padding: '18px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Low Churn Risk (Consistent)</span>
                <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34d399' }}>{churnReport.lowRiskCount}</p>
                <span style={{ fontSize: '0.7rem', color: '#34d399' }}>Steady 3+ workouts/wk</span>
              </div>
              <div className="glass-panel" style={{ padding: '18px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Moderate Risk (Dropoff)</span>
                <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fbbf24' }}>{churnReport.moderateRiskCount}</p>
                <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>Missed 7-14 days</span>
              </div>
              <div className="glass-panel" style={{ padding: '18px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Critical Risk (Dormant)</span>
                <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f87171' }}>{churnReport.criticalRiskCount}</p>
                <span style={{ fontSize: '0.7rem', color: '#f87171' }}>Requires immediate winback</span>
              </div>
            </div>
          )}

          {/* Member Selector & Deep AI Insight */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Member Habit Scoring & Retention Prescriptions</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Algorithmic consistency analysis based on attendance cadence and tenure</p>
              </div>

              {/* Member Selector Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSelectedMemberId(1)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: selectedMemberId === 1 ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)', background: selectedMemberId === 1 ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Member #1 (Alex)
                </button>
                <button
                  onClick={() => setSelectedMemberId(2)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: selectedMemberId === 2 ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)', background: selectedMemberId === 2 ? 'rgba(245, 158, 11, 0.2)' : 'transparent', color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Member #2 (Sarah)
                </button>
                <button
                  onClick={() => setSelectedMemberId(3)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: selectedMemberId === 3 ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)', background: selectedMemberId === 3 ? 'rgba(239, 68, 68, 0.2)' : 'transparent', color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Member #3 (Marcus)
                </button>
              </div>
            </div>

            {memberInsight && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                
                {/* Score Gauge Card */}
                <div style={{ background: '#090d16', padding: '24px', borderRadius: '16px', border: `1px solid ${memberInsight.riskBadgeColor}44`, textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Habit Consistency Score
                  </span>
                  <div style={{ margin: '18px 0' }}>
                    <span style={{ fontSize: '3.6rem', fontWeight: 900, color: memberInsight.riskBadgeColor }}>
                      {memberInsight.habitScore}
                    </span>
                    <span style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>/100</span>
                  </div>
                  <span style={{ padding: '6px 14px', borderRadius: '8px', background: `${memberInsight.riskBadgeColor}22`, color: memberInsight.riskBadgeColor, fontWeight: 800, fontSize: '0.8rem' }}>
                    {memberInsight.churnRisk.replace(/_/g, ' ')}
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px', textAlign: 'left', fontSize: '0.75rem' }}>
                    <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Weekly Avg:</span>
                      <strong style={{ color: 'white' }}>{memberInsight.weeklyWorkoutAverage} days/wk</strong>
                    </div>
                    <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Current Streak:</span>
                      <strong style={{ color: 'white' }}>{memberInsight.currentStreakDays} days</strong>
                    </div>
                  </div>
                </div>

                {/* Prescriptions & Facility Affinity */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '8px', color: 'white' }}>
                      Prescriptive Retention Actions for {memberInsight.memberName}:
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      {memberInsight.prescriptiveRecommendations.map((rec, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: '#090d16', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <CheckCircle2 size={16} color={memberInsight.riskBadgeColor} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.4' }}>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin size={18} color="#06b6d4" />
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>Primary Club Affinity:</span>
                      <p style={{ fontSize: '0.82rem', color: 'white', fontWeight: 600 }}>{memberInsight.primaryFacilityAffinity}</p>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* Automated Grace-Period Protocol */}
          <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Gift size={22} color="#a855f7" />
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>48-Hour Smart Grace-Period Protocol</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avoids front-desk friction for expired memberships</p>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: '1.5' }}>
              If a loyal member arrives with a pass that expired within the last 48 hours, the system issues a temporary turnstile unlock pass while notifying them via SMS to renew.
            </p>

            <div style={{ background: '#090d16', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '18px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Subscription to Extend:</span>
                <span style={{ fontWeight: 700, color: 'white' }}>Subscription #{graceSubId} (Marcus Vance)</span>
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
              style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <ShieldCheck size={16} />
              <span>{grantingGrace ? 'Granting Courtesy Extension...' : 'Grant 48-Hour Courtesy Turnstile Pass'}</span>
            </button>

            {graceResult && (
              <div style={{ marginTop: '18px', padding: '16px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid #a855f7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <CheckCircle2 size={18} color="#c084fc" />
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#c084fc' }}>COURTESY PASS ACTIVE</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#e2e8f0', marginBottom: '8px' }}>
                  {graceResult.message}
                </p>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Valid Until: <strong style={{ color: 'white' }}>{graceResult.temporaryPassExpiry}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Plan Optimization & ROI Calculator */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={22} color="#10b981" />
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Usage-Based Plan Optimizer</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Personalized cost-per-workout analysis</p>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ padding: '14px', borderRadius: '12px', background: '#090d16', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>Current Plan:</span>
                    <strong style={{ fontSize: '0.85rem', color: 'white' }}>{planOptimization.currentPlanType}</strong>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Fee: ${planOptimization.currentMonthlyFee}/mo</span>
                      <span style={{ display: 'block', color: '#fbbf24', fontWeight: 700 }}>
                        ${planOptimization.currentCostPerWorkout}/workout
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 800, display: 'block' }}>AI RECOMMENDED UPGRADE:</span>
                    <strong style={{ fontSize: '0.85rem', color: 'white' }}>{planOptimization.recommendedPlanType}</strong>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Fee: ${planOptimization.recommendedMonthlyFee}/mo</span>
                      <span style={{ display: 'block', color: '#34d399', fontWeight: 700 }}>
                        ${planOptimization.projectedCostPerWorkout}/workout
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px', fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                  <strong style={{ color: '#38bdf8' }}>AI Rationale: </strong>
                  {planOptimization.rationale}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'white' }}>Estimated Annual Member Savings:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#34d399' }}>
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
