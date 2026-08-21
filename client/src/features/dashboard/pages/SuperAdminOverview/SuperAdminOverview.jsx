import React, { useState, useEffect } from 'react';
import api from '../../../../services/apiClient';
import { FiActivity, FiTrendingUp, FiDownload, FiDollarSign, FiUsers, FiAward, FiRefreshCw } from 'react-icons/fi';
import './SuperAdminOverview.css';

const SuperAdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(7);
  const [customDates, setCustomDates] = useState({ startDate: '', endDate: '' });

  const [data, setData] = useState({
    upstream: { balance: 0, status: 'loading' },
    todayMetrics: { payins: { amount: 0, commission: 0, count: 0 }, payouts: { amount: 0, commission: 0, count: 0 } },
    yesterdayMetrics: { payins: { amount: 0, commission: 0, count: 0 }, payouts: { amount: 0, commission: 0, count: 0 } }
  });

  const [analytics, setAnalytics] = useState({ topMerchants: [], allMerchantsStats: [] });

  useEffect(() => { fetchSystemHealth(); }, []);

  useEffect(() => {
    if (daysFilter !== 'custom' || (customDates.startDate && customDates.endDate)) fetchAnalytics();
  }, [daysFilter, customDates.startDate, customDates.endDate]);

  const fetchSystemHealth = async () => {
    try {
      const res = await api.get('/v1/gateway/system/health');
      setData(res.data);
    } catch {}
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let url = `/dashboard/admin/analytics?days=${daysFilter}`;
      if (daysFilter === 'custom' && customDates.startDate && customDates.endDate)
        url = `/dashboard/admin/analytics?startDate=${customDates.startDate}&endDate=${customDates.endDate}`;
      const res = await api.get(url);
      if (res.data.success) setAnalytics({ topMerchants: res.data.topMerchants, allMerchantsStats: res.data.allMerchantsStats });
    } catch {}
    finally { setLoading(false); }
  };

  const calculateProfit = (m) => (m.payins.commission || 0) + (m.payouts.commission || 0);
  const todayProfit = calculateProfit(data.todayMetrics);
  const yesterdayProfit = calculateProfit(data.yesterdayMetrics);

  return (
    <div className="pg-root">
      {/* Header */}
      <div className="pg-toolbar">
        <div>
          <h3 className="sa-heading">SuperAdmin Dashboard</h3>
          <p className="sa-sub">System metrics & merchant performance</p>
        </div>
        <button className="pg-btn pg-btn-secondary" onClick={() => { fetchSystemHealth(); fetchAnalytics(); }}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Today's Metric Cards */}
      <div className="pg-stats-row">
        <div className="pg-stat-card">
          <div className="sa-stat-icon blue"><FiTrendingUp /></div>
          <div className="pg-stat-label">Today's Payin</div>
          <div className="pg-stat-val blue">₹{data.todayMetrics.payins.amount.toLocaleString('en-IN')}</div>
          <div className="pg-stat-sub">{data.todayMetrics.payins.count} transactions</div>
        </div>
        <div className="pg-stat-card">
          <div className="sa-stat-icon amber"><FiDownload /></div>
          <div className="pg-stat-label">Today's Payout</div>
          <div className="pg-stat-val" style={{ color: '#b45309' }}>₹{data.todayMetrics.payouts.amount.toLocaleString('en-IN')}</div>
          <div className="pg-stat-sub">{data.todayMetrics.payouts.count} transactions</div>
        </div>
        <div className="pg-stat-card">
          <div className="sa-stat-icon green"><FiDollarSign /></div>
          <div className="pg-stat-label">Today's Gross Profit</div>
          <div className="pg-stat-val green">₹{todayProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
          <div className="pg-stat-sub">Yesterday: ₹{yesterdayProfit.toLocaleString('en-IN')}</div>
        </div>
        <div className="pg-stat-card">
          <div className="sa-stat-icon purple"><FiActivity /></div>
          <div className="pg-stat-label">Upstream Balance</div>
          <div className="pg-stat-val" style={{ color: '#7c3aed' }}>
            {data.upstream?.status === 'loading' ? '---' : `₹${(data.upstream?.balance || 0).toLocaleString('en-IN')}`}
          </div>
          <div className="pg-stat-sub">{data.upstream?.status || 'checking...'}</div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="sa-grid">
        {/* Leaderboard */}
        <div className="pg-card">
          <div className="pg-card-header">
            <h4 className="pg-card-title">
              <span className="pg-card-title-icon" style={{ background: '#fffbeb', color: '#b45309' }}><FiAward /></span>
              Top Merchants
            </h4>
            <div className="sa-filter-group">
              <select className="pg-select" value={daysFilter} onChange={e => setDaysFilter(e.target.value)}>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value={3}>Last 3 Days</option>
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>
          {daysFilter === 'custom' && (
            <div className="sa-custom-dates">
              <input type="date" className="pg-input" value={customDates.startDate}
                onChange={e => setCustomDates({ ...customDates, startDate: e.target.value })} />
              <input type="date" className="pg-input" value={customDates.endDate}
                onChange={e => setCustomDates({ ...customDates, endDate: e.target.value })} />
            </div>
          )}
          <div className="pg-card-body">
            {analytics.topMerchants.length === 0 ? (
              <div className="pg-empty"><p>No data for selected period</p></div>
            ) : analytics.topMerchants.map((m, i) => (
              <div key={m._id} className="sa-leaderboard-row">
                <div className="sa-lb-rank">#{i + 1}</div>
                <div className="sa-lb-info">
                  <p className="sa-lb-name">{m.merchant.name}</p>
                  <small className="sa-lb-txn">{m.txCount} txns</small>
                </div>
                <div className="sa-lb-vol">₹{m.totalVolume.toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Merchant Performance Table */}
        <div className="pg-card">
          <div className="pg-card-header">
            <h4 className="pg-card-title">
              <span className="pg-card-title-icon"><FiUsers /></span>
              Merchant Performance (Lifetime)
            </h4>
          </div>
          <div className="pg-table-wrap">
            {loading ? (
              <div className="pg-loading"><FiRefreshCw /> Loading...</div>
            ) : (
              <table className="pg-table">
                <thead>
                  <tr>
                    <th>Merchant</th>
                    <th>Links Created</th>
                    <th>Total Payin</th>
                    <th>Total Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.allMerchantsStats.length === 0 ? (
                    <tr><td colSpan="4"><div className="pg-empty"><p>No merchant data</p></div></td></tr>
                  ) : analytics.allMerchantsStats.map(stat => (
                    <tr key={stat._id}>
                      <td>
                        <div className="sa-merchant-name">{stat.merchant.name}</div>
                        <div className="sa-merchant-email">{stat.merchant.email}</div>
                      </td>
                      <td><span className="pg-badge pg-badge-gray">{stat.totalLinksCreated}</span></td>
                      <td className="sa-payin-val">₹{stat.totalPayinAmount.toLocaleString('en-IN')}</td>
                      <td className="sa-payout-val">₹{stat.totalPayoutAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminOverview;
