import { useEffect, useState } from 'react';
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowDownLeft, FiArrowUpRight,
  FiChevronDown,
  FiChevronRight,
  FiDollarSign,
  FiPercent,
  FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../../../services/apiClient';
import KLineChart from './KLineChart';
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
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await api.get('/dashboard/stats');
      setData(response.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: 'var(--text-secondary)' }}>
        <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
        Loading Dashboard…
      </div>
    );
  }
  if (!data) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Failed to load data.</div>;

  const todayIn = data.stats.todayStats || {};
  const inRate = (todayIn.inSuccRate || 0).toFixed(2);
  const outRate = (todayIn.outSuccRate || 0).toFixed(2);
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
                  <span className="ov-ratio-stat-value green">₹{Number(todayIn.inSuccAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="ov-ratio-stat">
                  <span className="ov-ratio-stat-label">Total Amount</span>
                  <span className="ov-ratio-stat-value">₹{Number(todayIn.inAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                  <span className="ov-ratio-stat-value green">₹{Number(todayIn.outSuccAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="ov-ratio-stat">
                  <span className="ov-ratio-stat-label">Total Amount</span>
                  <span className="ov-ratio-stat-value">₹{Number(todayIn.outAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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

      {/* ── K-Line Chart ── */}
      <KLineChart />

      {/* ── Fee Rate Info ── */}
      <Section title="Fee Rate Info" icon={FiPercent} defaultOpen={true}>
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

    </div>
  );
};

export default Overview;
