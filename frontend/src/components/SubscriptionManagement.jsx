import React, { useState, useEffect } from 'react';
import { subscriptionApi, memberApi } from '../api/client';
import { CreditCard, PlusCircle, RefreshCw, Calendar, CheckCircle2, Clock, Sparkles, AlertCircle } from 'lucide-react';

export default function SubscriptionManagement() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [renewModalSub, setRenewModalSub] = useState(null);
  const [extensionMonths, setExtensionMonths] = useState(3);
  const [updatedPlanType, setUpdatedPlanType] = useState('');
  const [message, setMessage] = useState('');

  const [newSubData, setNewSubData] = useState({
    memberId: 1,
    planType: 'ALL_ACCESS_ANNUAL',
    facilityTier: 'MULTI_FACILITY',
    price: 599.99,
    autoRenew: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, memsRes] = await Promise.all([
        subscriptionApi.getAll(),
        memberApi.getAll()
      ]);
      setSubscriptions(subsRes.data);
      setMembers(memsRes.data);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    try {
      await subscriptionApi.create({
        ...newSubData,
        memberId: Number(newSubData.memberId),
        price: Number(newSubData.price)
      });
      setShowAddModal(false);
      setMessage('Subscription successfully activated!');
      setTimeout(() => setMessage(''), 4000);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create subscription');
    }
  };

  const handleRenewSubscription = async (e) => {
    e.preventDefault();
    if (!renewModalSub) return;
    try {
      await subscriptionApi.renew(renewModalSub.subscriptionId, {
        extensionMonths: Number(extensionMonths),
        updatedPlanType: updatedPlanType || renewModalSub.planType,
        renewalPrice: Number(extensionMonths) * 45
      });
      setRenewModalSub(null);
      setMessage(`Subscription #${renewModalSub.subscriptionId} renewed for ${extensionMonths} months! Turnstile access is now active.`);
      setTimeout(() => setMessage(''), 5000);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Renewal failed');
    }
  };

  const getMemberName = (mId) => {
    const mem = members.find(m => m.memberId === mId);
    return mem ? mem.name : `Member #${mId}`;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Subscription & Plan Management</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Lifecycle management served by Subscription Service (:8083)</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '8px 14px' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Assign New Plan</span>
          </button>
        </div>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: '#34d399', fontSize: '0.85rem', marginBottom: '20px' }}>
          {message}
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Sub ID</th>
              <th>Member Name</th>
              <th>Plan Type</th>
              <th>Facility Tier</th>
              <th>Start Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Price</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading subscriptions from Subscription Service...
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No subscriptions found.
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => {
                const isExpired = !sub.currentlyValid;
                return (
                  <tr key={sub.subscriptionId}>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>
                        #{sub.subscriptionId}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.92rem' }}>{getMemberName(sub.memberId)}</strong>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)' }}>ID: {sub.memberId}</span>
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        {sub.planType}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {sub.facilityTier}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> {sub.startDate}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: isExpired ? '#f87171' : '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {sub.expiryDate}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${sub.currentlyValid ? 'badge-green' : 'badge-red'}`}>
                        {sub.currentlyValid ? 'ACTIVE' : 'EXPIRED'}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        ${sub.price ? sub.price.toFixed(2) : '0.00'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setRenewModalSub(sub);
                          setUpdatedPlanType(sub.planType);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', borderColor: isExpired ? '#f59e0b' : undefined }}
                      >
                        <Sparkles size={14} color={isExpired ? '#f59e0b' : '#34d399'} />
                        <span>Renew Plan</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Renew Modal */}
      {renewModalSub && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '32px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
              Renew Subscription #{renewModalSub.subscriptionId}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Extending pass for: <strong>{getMemberName(renewModalSub.memberId)}</strong>
            </p>

            <form onSubmit={handleRenewSubscription} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Extension Period
                </label>
                <select
                  className="input-field"
                  value={extensionMonths}
                  onChange={(e) => setExtensionMonths(e.target.value)}
                >
                  <option value={1}>+ 1 Month ($45.00)</option>
                  <option value={3}>+ 3 Months ($135.00)</option>
                  <option value={6}>+ 6 Months ($250.00)</option>
                  <option value={12}>+ 12 Months VIP ($480.00)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Plan Upgrade / Type
                </label>
                <select
                  className="input-field"
                  value={updatedPlanType}
                  onChange={(e) => setUpdatedPlanType(e.target.value)}
                >
                  <option value="BASIC_MONTHLY">BASIC_MONTHLY (Single Facility)</option>
                  <option value="PREMIUM_QUARTERLY">PREMIUM_QUARTERLY (Multi-Facility)</option>
                  <option value="ALL_ACCESS_ANNUAL">ALL_ACCESS_ANNUAL (VIP Multi-Facility)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setRenewModalSub(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Renewal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign New Subscription Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>Assign Membership Plan</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Creates subscription and calculates validity window
            </p>

            <form onSubmit={handleCreateSubscription} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Select Member *
                </label>
                <select
                  className="input-field"
                  value={newSubData.memberId}
                  onChange={(e) => setNewSubData({ ...newSubData, memberId: e.target.value })}
                >
                  {members.map(m => (
                    <option key={m.memberId} value={m.memberId}>
                      #{m.memberId} - {m.name} ({m.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Plan Tier
                </label>
                <select
                  className="input-field"
                  value={newSubData.planType}
                  onChange={(e) => {
                    const type = e.target.value;
                    let price = 49.99;
                    if (type === 'PREMIUM_QUARTERLY') price = 149.99;
                    if (type === 'ALL_ACCESS_ANNUAL') price = 599.99;
                    setNewSubData({ ...newSubData, planType: type, price });
                  }}
                >
                  <option value="BASIC_MONTHLY">BASIC_MONTHLY (1 Month)</option>
                  <option value="PREMIUM_QUARTERLY">PREMIUM_QUARTERLY (3 Months)</option>
                  <option value="ALL_ACCESS_ANNUAL">ALL_ACCESS_ANNUAL (12 Months)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Facility Access Tier
                </label>
                <select
                  className="input-field"
                  value={newSubData.facilityTier}
                  onChange={(e) => setNewSubData({ ...newSubData, facilityTier: e.target.value })}
                >
                  <option value="SINGLE_FACILITY">SINGLE_FACILITY</option>
                  <option value="MULTI_FACILITY">MULTI_FACILITY</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Plan Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={newSubData.price}
                  onChange={(e) => setNewSubData({ ...newSubData, price: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Activate Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
