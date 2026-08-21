import React, { useState, useEffect } from 'react';
import { 
  FiActivity, FiPieChart, FiDollarSign, 
  FiPercent, FiKey, FiSettings 
} from 'react-icons/fi';
import AccordionPanel from '../../../../components/ui/Accordion/AccordionPanel';
import api from '../../../../services/apiClient';
import { toast } from 'react-toastify';
import './Overview.css';

const Overview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states for settings
  const [payInUrl, setPayInUrl] = useState('');
  const [payOutUrl, setPayOutUrl] = useState('');

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setData(response.data);
      if (response.data.settings) {
        setPayInUrl(response.data.settings.callbackUrl || '');
        setPayOutUrl(response.data.settings.callbackUrl || ''); // using same for now
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleResetApiKey = async () => {
    if (!window.confirm("Are you sure? This will invalidate your old API key immediately.")) return;
    
    try {
      const response = await api.post('/dashboard/settings/apikey/reset');
      toast.success('API Key Reset Successfully');
      fetchStats(); // refresh to get new key
    } catch (error) {
      toast.error('Failed to reset API key');
    }
  };

  const handleUpdateWebhooks = async () => {
    try {
      await api.put('/dashboard/settings/webhooks', {
        callbackUrl: payInUrl
      });
      toast.success('Webhook URLs updated');
    } catch (error) {
      toast.error('Failed to update webhooks');
    }
  };

  if (loading) return <div className="loading-spinner">Loading Data...</div>;
  if (!data) return <div>Failed to load data</div>;

  return (
    <div className="overview-page">
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <div className="page-actions">
           {/* Custom actions can go here */}
        </div>
      </div>

      {data.stats.frozenAmount > 0 && (
        <div style={{
          background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', 
          padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px'
        }}>
          <div style={{ fontSize: '20px' }}>⚠️</div>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>Balance on Hold: ₹{data.stats.frozenAmount}</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              <strong>Reason:</strong> {data.stats.frozenReason || 'Under review by administration.'}
            </p>
          </div>
        </div>
      )}

      <AccordionPanel title="Today Statistics" icon={FiActivity} defaultOpen={true}>
        {/* Success Ratios */}
        <div className="ratio-grid">
          
          <div className="ratio-section">
            <div className="ratio-stats">
              <div className="ratio-stat-item">
                <span className="ratio-label" style={{ color: '#10b981' }}>In Succ Amount</span>
                <span className="ratio-value">{data.stats.todayStats?.inSuccAmount || 0}</span>
              </div>
              <div className="ratio-stat-item">
                <span className="ratio-label">In Amount</span>
                <span className="ratio-value">{data.stats.todayStats?.inAmount || 0}</span>
              </div>
            </div>
            
            <div className="circular-chart" style={{ background: `conic-gradient(var(--primary) ${data.stats.todayStats?.inSuccRate || 0}%, #f1f5f9 0)` }}>
              <div className="circular-chart-inner">
                <span className="circular-chart-value">{(data.stats.todayStats?.inSuccRate || 0).toFixed(2)}%</span>
                <span className="circular-chart-label">Amount Succ Rate</span>
              </div>
            </div>
          </div>

          <div className="ratio-section">
            <div className="ratio-stats">
              <div className="ratio-stat-item">
                <span className="ratio-label" style={{ color: '#10b981' }}>Out Succ Amount</span>
                <span className="ratio-value">{data.stats.todayStats?.outSuccAmount || 0}</span>
              </div>
              <div className="ratio-stat-item">
                <span className="ratio-label">Out Amount</span>
                <span className="ratio-value">{data.stats.todayStats?.outAmount || 0}</span>
              </div>
            </div>
            
            <div className="circular-chart" style={{ background: `conic-gradient(var(--primary) ${data.stats.todayStats?.outSuccRate || 0}%, #f1f5f9 0)` }}>
              <div className="circular-chart-inner">
                <span className="circular-chart-value">{(data.stats.todayStats?.outSuccRate || 0).toFixed(2)}%</span>
                <span className="circular-chart-label">Amount Succ Rate</span>
              </div>
            </div>
          </div>

        </div>

        <div style={{ height: '1px', background: 'var(--border-color)', margin: '2rem 0' }}></div>

        {/* Existing Wallet Balances */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-title">Wallet Balance</div>
            <div className="stat-value">₹{data.stats.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Total Received</div>
            <div className="stat-value text-success">₹{data.stats.totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Total Withdrawals</div>
            <div className="stat-value text-danger">₹{data.stats.totalWithdrawals.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
      </AccordionPanel>

      <AccordionPanel title="K-Line Chart" icon={FiPieChart}>
        <div className="chart-placeholder">
          {/* Chart implementation goes here */}
          <p>Chart data visualization will appear here.</p>
        </div>
      </AccordionPanel>

      <AccordionPanel title="Money Detail" icon={FiDollarSign} defaultOpen={true}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Currency</th>
              <th>Balance</th>
              <th>Avail Bal</th>
              <th>Fro Bal</th>
              <th>Operate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{data.user?.name || 'Merchant'}</td>
              <td><span className="currency-badge">INR</span></td>
              <td>{data.stats.walletBalance}</td>
              <td>{data.stats.walletBalance}</td>
              <td>0</td>
              <td className="operate-actions">
                <button className="action-btn text-danger">Withdraw</button>
                <button className="action-btn">Withdraw Record</button>
              </td>
            </tr>
          </tbody>
        </table>
      </AccordionPanel>

      <AccordionPanel title="Fee RateInfo" icon={FiPercent}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Fee Rate Config</th>
              <th>Fee Rate</th>
              <th>Fee Amount</th>
              <th>Open Close</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="badge badge-success">Pay In</span></td>
              <td>{(data.settings.commissionRate * 100).toFixed(2)}%</td>
              <td>0</td>
              <td><span className="status-badge open">Open</span></td>
            </tr>
            <tr>
              <td><span className="badge badge-danger">Pay Out</span></td>
              <td>{(data.settings.commissionRate * 100).toFixed(2)}%</td>
              <td>0</td>
              <td><span className="status-badge open">Open</span></td>
            </tr>
            <tr>
              <td><span className="badge badge-warning">withdraw</span></td>
              <td>0.00%</td>
              <td>0</td>
              <td><span className="status-badge close">Close</span></td>
            </tr>
          </tbody>
        </table>
      </AccordionPanel>

      <AccordionPanel title="Api Key" icon={FiKey}>
        <div className="api-key-section">
          <div className="api-key-row">
            <span className="api-key-label">Api Key</span>
            <span className="api-key-value">
              {data.settings.activeApiKey ? data.settings.activeApiKey : '************************'}
            </span>
          </div>
          <button className="btn-primary mt-3" onClick={handleResetApiKey}>
            Reset Api Key
          </button>
        </div>
      </AccordionPanel>

      <AccordionPanel title="Merchant Setting" icon={FiSettings}>
        <div className="merchant-settings-form">
          <div className="form-group row">
            <label className="col-label"><span className="text-danger">*</span> payIn_notify_url</label>
            <div className="col-input">
              <input 
                type="text" 
                value={payInUrl} 
                onChange={(e) => setPayInUrl(e.target.value)} 
                className="form-control"
              />
            </div>
          </div>
          <div className="form-group row">
            <label className="col-label"><span className="text-danger">*</span> payOut_notify_url</label>
            <div className="col-input">
              <input 
                type="text" 
                value={payOutUrl} 
                onChange={(e) => setPayOutUrl(e.target.value)} 
                className="form-control"
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleUpdateWebhooks}>Confirm</button>
          </div>
        </div>
      </AccordionPanel>

    </div>
  );
};

export default Overview;
