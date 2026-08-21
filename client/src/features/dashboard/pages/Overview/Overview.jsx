import React, { useState, useEffect } from 'react';
import {
  FiActivity, FiPieChart, FiDollarSign,
  FiPercent, FiKey, FiSettings,
  FiTrendingUp, FiArrowDownLeft, FiArrowUpRight,
  FiChevronRight, FiChevronDown, FiAlertTriangle,
  FiRefreshCw, FiCopy, FiCheck
} from 'react-icons/fi';
import api from '../../../../services/apiClient';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog';
import useConfirm from '../../../../components/ui/ConfirmDialog/useConfirm';
import './Overview.css';

/* ── Collapsible Section ─────────────────────── */
const Section = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`ov-section${open ? ' open' : ''}`}>
      <div className="ov-section-header" onClick={() => setOpen(o => !o)}>
        <div className="ov-section-title-group">
          <div className="ov-section-icon">{Icon && <Icon />}</div>
          <h3 className="ov-section-title">{title}</h3>
        </div>
        <span className="ov-section-chevron">
          {open ? <FiChevronDown /> : <FiChevronRight />}
        </span>
      </div>
      {open && <div className="ov-section-body">{children}</div>}
    </div>
  );
};

/* ── Main Component ──────────────────────────── */
const Overview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payInUrl, setPayInUrl] = useState('');
  const [payOutUrl, setPayOutUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { confirm, confirmProps } = useConfirm();

  const fetchStats = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await api.get('/dashboard/stats');
      setData(response.data);
      if (response.data.settings) {
        setPayInUrl(response.data.settings.callbackUrl || '');
        setPayOutUrl(response.data.settings.callbackUrl || '');
      }
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleResetApiKey = async () => {
    const ok = await confirm({
      title: 'Reset API Key?',
      message: 'This will immediately invalidate your current API key. Any active integrations using the old key will stop working.',
      confirmText: 'Yes, Reset Key',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.post('/dashboard/settings/apikey/reset');
      toast.success('API Key reset successfully');
      fetchStats(false);
    } catch {
      toast.error('Failed to reset API key');
    }
  };

  const handleUpdateWebhooks = async () => {
    try {
      await api.put('/dashboard/settings/webhooks', { callbackUrl: payInUrl });
      toast.success('Webhook URLs updated');
    } catch {
      toast.error('Failed to update webhooks');
    }
  };

  const handleCopyKey = () => {
    if (!data?.settings?.activeApiKey) return;
    navigator.clipboard.writeText(data.settings.activeApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: 'var(--text-secondary)' }}>
        <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
        Loading Dashboard…
      </div>
    );
  }
  if (!data) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Failed to load data.</div>;

  const todayIn  = data.stats.todayStats || {};
  const inRate   = (todayIn.inSuccRate  || 0).toFixed(2);
  const outRate  = (todayIn.outSuccRate || 0).toFixed(2);
  const commission = data.settings?.commission || {};

  return (
    <div className="overview-page">

      {/* ── Header ── */}
      <div className="overview-header">
        <div>
          <h2 className="overview-title">Dashboard Overview</h2>
          <p className="overview-subtitle">Welcome back! Here's your account summary.</p>
        </div>
        <button
          className="ov-action-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => fetchStats(false)}
          disabled={refreshing}
        >
          <FiRefreshCw style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Frozen Balance Alert ── */}
      {data.stats.frozenAmount > 0 && (
        <div className="frozen-banner">
          <FiAlertTriangle className="frozen-banner-icon" />
          <div>
            <h4>Balance on Hold: ₹{(data.stats.frozenAmount || 0).toLocaleString('en-IN')}</h4>
            <p><strong>Reason:</strong> {data.stats.frozenReason || 'Under review by administration.'}</p>
          </div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="ov-stats-grid">
        <div className="ov-stat-card balance">
          <div className="ov-stat-label">Wallet Balance</div>
          <div className="ov-stat-value">
            ₹{(data.stats.walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="ov-stat-icon"><FiDollarSign /></div>
        </div>
        <div className="ov-stat-card received">
          <div className="ov-stat-label">Total Received</div>
          <div className="ov-stat-value success">
            ₹{(data.stats.totalReceived || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="ov-stat-icon"><FiArrowDownLeft /></div>
        </div>
        <div className="ov-stat-card withdrawn">
          <div className="ov-stat-label">Total Withdrawn</div>
          <div className="ov-stat-value danger">
            ₹{(data.stats.totalWithdrawals || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="ov-stat-icon"><FiArrowUpRight /></div>
        </div>
      </div>

      {/* ── Today's Statistics ── */}
      <Section title="Today's Statistics" icon={FiActivity} defaultOpen={true}>
        <div className="ov-ratio-grid">
          {/* Payin */}
          <div className="ov-ratio-card">
            <div>
              <p className="ov-ratio-title">Pay In Performance</p>
              <div className="ov-ratio-stats">
                <div className="ov-ratio-stat">
                  <span className="ov-ratio-stat-label">Success Amount</span>
                  <span className="ov-ratio-stat-value green">₹{todayIn.inSuccAmount || 0}</span>
                </div>
                <div className="ov-ratio-stat">
                  <span className="ov-ratio-stat-label">Total Amount</span>
                  <span className="ov-ratio-stat-value">₹{todayIn.inAmount || 0}</span>
                </div>
              </div>
            </div>
            <div
              className="ov-circle"
              style={{ background: `conic-gradient(#3b82f6 ${inRate}%, #f1f5f9 0)` }}
            >
              <div className="ov-circle-inner">
                <span className="ov-circle-pct">{inRate}%</span>
                <span className="ov-circle-desc">Succ Rate</span>
              </div>
            </div>
          </div>

          {/* Payout */}
          <div className="ov-ratio-card">
            <div>
              <p className="ov-ratio-title">Pay Out Performance</p>
              <div className="ov-ratio-stats">
                <div className="ov-ratio-stat">
                  <span className="ov-ratio-stat-label">Success Amount</span>
                  <span className="ov-ratio-stat-value green">₹{todayIn.outSuccAmount || 0}</span>
                </div>
                <div className="ov-ratio-stat">
                  <span className="ov-ratio-stat-label">Total Amount</span>
                  <span className="ov-ratio-stat-value">₹{todayIn.outAmount || 0}</span>
                </div>
              </div>
            </div>
            <div
              className="ov-circle"
              style={{ background: `conic-gradient(#10b981 ${outRate}%, #f1f5f9 0)` }}
            >
              <div className="ov-circle-inner">
                <span className="ov-circle-pct">{outRate}%</span>
                <span className="ov-circle-desc">Succ Rate</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── K-Line Chart Placeholder ── */}
      <Section title="K-Line Chart" icon={FiPieChart}>
        <div className="ov-chart-placeholder">
          <FiPieChart />
          <p>Chart visualization coming soon</p>
        </div>
      </Section>

      {/* ── Money Detail ── */}
      <Section title="Money Detail" icon={FiDollarSign} defaultOpen={true}>
        <div style={{ overflowX: 'auto' }}>
          <table className="ov-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Currency</th>
                <th>Balance</th>
                <th>Available</th>
                <th>Frozen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>{data.user?.name || 'Merchant'}</td>
                <td><span className="ov-badge inr">INR</span></td>
                <td style={{ fontWeight: 600 }}>₹{(data.stats.walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ color: '#10b981', fontWeight: 600 }}>₹{(data.stats.walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td>₹0.00</td>
                <td>
                  <div className="ov-table-actions">
                    <button className="ov-action-btn danger">Withdraw</button>
                    <button className="ov-action-btn">History</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Fee Rate Info ── */}
      <Section title="Fee Rate Info" icon={FiPercent}>
        <div style={{ overflowX: 'auto' }}>
          <table className="ov-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Fee Rate</th>
                <th>Flat Fee (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="ov-badge payin">Pay In</span></td>
                <td>{commission.payin?.percent ?? (data.settings.commissionRate * 100).toFixed(2)}%</td>
                <td>₹{commission.payin?.flat ?? 0}</td>
                <td><span className="ov-status open">Open</span></td>
              </tr>
              <tr>
                <td><span className="ov-badge payout">Pay Out</span></td>
                <td>{commission.payout?.percent ?? (data.settings.commissionRate * 100).toFixed(2)}%</td>
                <td>₹{commission.payout?.flat ?? 0}</td>
                <td><span className="ov-status open">Open</span></td>
              </tr>
              <tr>
                <td><span className="ov-badge withdraw">Withdraw</span></td>
                <td>0.00%</td>
                <td>₹0</td>
                <td><span className="ov-status closed">Closed</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── API Key ── */}
      <Section title="API Key" icon={FiKey}>
        <div className="ov-api-key-block">
          <span className="ov-api-key-label">API Key</span>
          <span className="ov-api-key-value">
            {data.settings?.activeApiKey || '••••••••••••••••••••••••••••••••'}
          </span>
          <button
            className="ov-action-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={handleCopyKey}
          >
            {copied ? <FiCheck style={{ color: '#10b981' }} /> : <FiCopy />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button className="ov-btn-danger" onClick={handleResetApiKey}>
          Reset API Key
        </button>
      </Section>

      {/* ── Merchant Settings ── */}
      <Section title="Merchant Settings" icon={FiSettings}>
        <div className="ov-webhook-form">
          <div className="ov-form-row">
            <label className="ov-form-label">
              <span>*</span>PayIn Notify URL
            </label>
            <input
              type="url"
              className="ov-form-input"
              placeholder="https://yourdomain.com/payin-callback"
              value={payInUrl}
              onChange={e => setPayInUrl(e.target.value)}
            />
          </div>
          <div className="ov-form-row">
            <label className="ov-form-label">
              <span>*</span>PayOut Notify URL
            </label>
            <input
              type="url"
              className="ov-form-input"
              placeholder="https://yourdomain.com/payout-callback"
              value={payOutUrl}
              onChange={e => setPayOutUrl(e.target.value)}
            />
          </div>
          <button className="ov-btn-confirm" onClick={handleUpdateWebhooks}>
            Save Webhook URLs
          </button>
        </div>
      </Section>

      <ConfirmDialog {...confirmProps} />
    </div>
  );
};

export default Overview;
