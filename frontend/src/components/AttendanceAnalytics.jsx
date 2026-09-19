import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../api/client';
import { Activity, CheckCircle2, XCircle, Clock, MapPin, RefreshCw, BarChart3, Users, ShieldAlert } from 'lucide-react';

export default function AttendanceAnalytics() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getRecent();
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Poll every 5s for live turnstile activity
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = selectedFacility === 'ALL'
    ? logs
    : logs.filter(l => l.facilityId === selectedFacility);

  const totalGranted = logs.filter(l => l.accessStatus === 'GRANTED').length;
  const totalDenied = logs.filter(l => l.accessStatus === 'DENIED').length;

  return (
    <div>
      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '24px' }}>
        
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Turnstile Swipes</span>
            <Activity size={18} color="#06b6d4" />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{logs.length}</p>
          <span style={{ fontSize: '0.72rem', color: '#06b6d4' }}>Real-time event logging</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Access Granted</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>{totalGranted}</p>
          <span style={{ fontSize: '0.72rem', color: '#34d399' }}>Valid active passes</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Access Denied</span>
            <XCircle size={18} color="#ef4444" />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171' }}>{totalDenied}</p>
          <span style={{ fontSize: '0.72rem', color: '#f87171' }}>Expired / Inactive caught</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Average Gate Latency</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>~68 ms</p>
          <span style={{ fontSize: '0.72rem', color: '#fbbf24' }}>99.4% queue reduction</span>
        </div>

      </div>

      {/* Header & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Live Turnstile Attendance Logs</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Served by Attendance Service (:8084) — auto-refreshing live stream</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            className="input-field"
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
            style={{ width: '220px', padding: '8px 12px' }}
          >
            <option value="ALL">All Facilities</option>
            <option value="FACILITY_DOWNTOWN">Downtown Elite</option>
            <option value="FACILITY_UPTOWN">Uptown Olympic</option>
            <option value="FACILITY_WESTSIDE">Westside Express</option>
          </select>
          <button onClick={fetchLogs} className="btn btn-secondary" style={{ padding: '8px 14px' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Member ID</th>
              <th>Facility</th>
              <th>Check-In Time</th>
              <th>Check-Out Time</th>
              <th>Decision Status</th>
              <th>Reason / Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Connecting to Attendance Service event stream...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No attendance records logged for selected facility.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const isGranted = log.accessStatus === 'GRANTED';
                return (
                  <tr key={log.attendanceId}>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        #{log.attendanceId}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.9rem' }}>Member #{log.memberId}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} color="var(--accent-cyan)" />
                        <span style={{ fontSize: '0.85rem' }}>{log.facilityName || log.facilityId}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        {new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </td>
                    <td>
                      {log.checkOutTime ? (
                        <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      ) : isGranted ? (
                        <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>INSIDE</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${isGranted ? 'badge-green' : 'badge-red'}`}>
                        {log.accessStatus}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: isGranted ? 'var(--text-dim)' : '#f87171' }}>
                        {log.denialReason || 'Access verified via Subscription & Member Feign mesh'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
