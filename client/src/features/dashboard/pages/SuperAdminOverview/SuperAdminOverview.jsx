import { useEffect, useState } from 'react';
import { FiActivity, FiAward, FiDatabase, FiDollarSign, FiDownload, FiRefreshCw, FiTrendingUp, FiUsers } from 'react-icons/fi';
import api from '../../../../services/apiClient';
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
      setLoading(true);
      const res = await api.get('/v1/gateway/system/health');
      setData(res.data);
    } catch { }
    finally { setLoading(false); }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let url = `/dashboard/admin/analytics?days=${daysFilter}`;
      if (daysFilter === 'custom' && customDates.startDate && customDates.endDate)
        url = `/dashboard/admin/analytics?startDate=${customDates.startDate}&endDate=${customDates.endDate}`;
      const res = await api.get(url);
      if (res.data.success) setAnalytics({ topMerchants: res.data.topMerchants, allMerchantsStats: res.data.allMerchantsStats });
    } catch { }
    finally { setLoading(false); }
  };

  const calculateProfit = (m) => (m.payins.commission || 0) + (m.payouts.commission || 0);
  const todayProfit = calculateProfit(data.todayMetrics);
  const yesterdayProfit = calculateProfit(data.yesterdayMetrics);

  const totals = analytics.allMerchantsStats.reduce((acc, curr) => {
    acc.createdAmount += (curr.totalCreatedAmount || 0);
    acc.createdCount += (curr.totalLinksCreated || 0);
    acc.successAmount += (curr.successAmount || 0);
    acc.successCount += (curr.successCount || 0);
    acc.pendingAmount += (curr.pendingAmount || 0);
    acc.pendingCount += (curr.pendingCount || 0);
    acc.failedAmount += (curr.failedAmount || 0);
    acc.failedCount += (curr.failedCount || 0);
    acc.payoutCreatedAmount += (curr.payoutCreatedAmount || 0);
    acc.payoutCreatedCount += (curr.payoutCreatedCount || 0);
    acc.payoutSuccessAmount += (curr.payoutSuccessAmount || 0);
    acc.payoutSuccessCount += (curr.payoutSuccessCount || 0);
    acc.payoutPendingAmount += (curr.payoutPendingAmount || 0);
    acc.payoutPendingCount += (curr.payoutPendingCount || 0);
    acc.payoutFailedAmount += (curr.payoutFailedAmount || 0);
    acc.payoutFailedCount += (curr.payoutFailedCount || 0);
    return acc;
  }, {
    createdAmount: 0, createdCount: 0, successAmount: 0, successCount: 0,
    pendingAmount: 0, pendingCount: 0, failedAmount: 0, failedCount: 0,
    payoutCreatedAmount: 0, payoutCreatedCount: 0, payoutSuccessAmount: 0, payoutSuccessCount: 0,
    payoutPendingAmount: 0, payoutPendingCount: 0, payoutFailedAmount: 0, payoutFailedCount: 0
  });

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
        <div className="pg-stat-card">
          <div className="sa-stat-icon" style={{ background: '#fef2f2', color: '#e11d48' }}><FiDatabase /></div>
          <div className="pg-stat-label">Total Users Balance</div>
          <div className="pg-stat-val" style={{ color: '#e11d48' }}>
            ₹{(data.totalUserBalance || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="pg-stat-sub">Across all wallets</div>
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
              Merchant Performance ({daysFilter === 'custom' ? 'Custom Range' : 'Selected Period'})
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
                    <th>Created (In / Out)</th>
                    <th>Success (In / Out)</th>
                    <th>Pending (In / Out)</th>
                    <th>Failed (In / Out)</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.allMerchantsStats.length === 0 ? (
                    <tr><td colSpan="6"><div className="pg-empty"><p>No merchant data</p></div></td></tr>
                  ) : analytics.allMerchantsStats.map(stat => (
                    <tr key={stat._id}>
                      <td>
                        <div
                          className="sa-merchant-name"
                          style={{ cursor: 'pointer', color: '#2563eb', textDecoration: 'underline' }}
                          onClick={() => window.location.href = `/dashboard/users/${stat._id}`}
                        >
                          {stat.merchant.name}
                        </div>
                        <div className="sa-merchant-email">{stat.merchant.email}</div>
                      </td>
                      <td>
                        <div style={{ marginBottom: '6px' }}>
                          <span className="pg-font-medium" style={{ color: '#2563eb' }}>₹{(stat.totalCreatedAmount || 0).toLocaleString('en-IN')}</span>
                          <span className="pg-badge pg-badge-gray" style={{ cursor: 'pointer', textDecoration: 'underline', marginLeft: '4px' }} onClick={() => window.location.href = `/dashboard/system-payins?merchantId=${stat._id}`}>
                            {stat.totalLinksCreated || 0} in
                          </span>
                        </div>
                        <div>
                          <span className="pg-font-medium" style={{ color: '#b45309' }}>₹{(stat.payoutCreatedAmount || 0).toLocaleString('en-IN')}</span>
                          <span className="pg-badge pg-badge-gray" style={{ cursor: 'pointer', textDecoration: 'underline', marginLeft: '4px' }} onClick={() => window.location.href = `/dashboard/system-payouts?merchantId=${stat._id}`}>
                            {stat.payoutCreatedCount || 0} out
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ marginBottom: '6px' }}>
                          <span className="sa-payin-val">₹{(stat.successAmount || 0).toLocaleString('en-IN')}</span>
                          <span className="pg-badge" style={{ background: '#dcfce7', color: '#166534', marginLeft: '4px' }}>{stat.successCount || 0} in</span>
                        </div>
                        <div>
                          <span className="sa-payout-val">₹{(stat.payoutSuccessAmount || 0).toLocaleString('en-IN')}</span>
                          <span className="pg-badge" style={{ background: '#dcfce7', color: '#166534', marginLeft: '4px' }}>{stat.payoutSuccessCount || 0} out</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ marginBottom: '6px' }}>
                          <span className="pg-font-medium" style={{ color: '#d97706' }}>₹{(stat.pendingAmount || 0).toLocaleString('en-IN')}</span>
                          <span className="pg-badge" style={{ background: '#fef3c7', color: '#b45309', marginLeft: '4px' }}>{stat.pendingCount || 0} in</span>
                        </div>
                        <div>
                          <span className="pg-font-medium" style={{ color: '#d97706' }}>₹{(stat.payoutPendingAmount || 0).toLocaleString('en-IN')}</span>
                          <span className="pg-badge" style={{ background: '#fef3c7', color: '#b45309', marginLeft: '4px' }}>{stat.payoutPendingCount || 0} out</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ marginBottom: '6px' }}>
                          <span className="pg-font-medium" style={{ color: '#dc2626' }}>₹{(stat.failedAmount || 0).toLocaleString('en-IN')}</span>
                          <span className="pg-badge" style={{ background: '#fee2e2', color: '#b91c1c', marginLeft: '4px' }}>{stat.failedCount || 0} in</span>
                        </div>
                        <div>
                          <span className="pg-font-medium" style={{ color: '#dc2626' }}>₹{(stat.payoutFailedAmount || 0).toLocaleString('en-IN')}</span>
                          <span className="pg-badge" style={{ background: '#fee2e2', color: '#b91c1c', marginLeft: '4px' }}>{stat.payoutFailedCount || 0} out</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {!loading && analytics.allMerchantsStats.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#f8fafc' }}>
                      <td style={{ fontWeight: 'bold' }}>Total (All Merchants)</td>
                      <td>
                        <div style={{ marginBottom: '6px' }}>
                          <span className="pg-font-medium" style={{ color: '#2563eb' }}>₹{totals.createdAmount.toLocaleString('en-IN')}</span>
                          <span className="pg-badge pg-badge-gray" style={{ cursor: 'pointer', textDecoration: 'underline', marginLeft: '4px' }} onClick={() => window.location.href = `/dashboard/system-payins`}>
                            {totals.createdCount} in
                          </span>
                        </div>
                        <div>
                          <span className="pg-font-medium" style={{ color: '#b45309' }}>₹{totals.payoutCreatedAmount.toLocaleString('en-IN')}</span>
                          <span className="pg-badge pg-badge-gray" style={{ cursor: 'pointer', textDecoration: 'underline', marginLeft: '4px' }} onClick={() => window.location.href = `/dashboard/system-payouts`}>
                            {totals.payoutCreatedCount} out
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ marginBottom: '6px' }}>
                          <span className="sa-payin-val">₹{totals.successAmount.toLocaleString('en-IN')}</span>
                          <span className="pg-badge" style={{ background: '#dcfce7', color: '#166534', marginLeft: '4px' }}>{totals.successCount} in</span>
                        </div>
                        <div>
                          <span className="sa-payout-val">₹{totals.payoutSuccessAmount.toLocaleString('en-IN')}</span>
                          <span className="pg-badge" style={{ background: '#dcfce7', color: '#166534', marginLeft: '4px' }}>{totals.payoutSuccessCount} out</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ marginBottom: '6px' }}>
                          <span className="pg-font-medium" style={{ color: '#d97706' }}>₹{totals.pendingAmount.toLocaleString('en-IN')}</span>
                          <span className="pg-badge" style={{ background: '#fef3c7', color: '#b45309', marginLeft: '4px' }}>{totals.pendingCount} in</span>
                        </div>
                        <div>
                          <span className="pg-font-medium" style={{ color: '#d97706' }}>₹{totals.payoutPendingAmount.toLocaleString('en-IN')}</span>
                          <span className="pg-badge" style={{ background: '#fef3c7', color: '#b45309', marginLeft: '4px' }}>{totals.payoutPendingCount} out</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ marginBottom: '6px' }}>
                          <span className="pg-font-medium" style={{ color: '#dc2626' }}>₹{totals.failedAmount.toLocaleString('en-IN')}</span>
                          <span className="pg-badge" style={{ background: '#fee2e2', color: '#b91c1c', marginLeft: '4px' }}>{totals.failedCount} in</span>
                        </div>
                        <div>
                          <span className="pg-font-medium" style={{ color: '#dc2626' }}>₹{totals.payoutFailedAmount.toLocaleString('en-IN')}</span>
                          <span className="pg-badge" style={{ background: '#fee2e2', color: '#b91c1c', marginLeft: '4px' }}>{totals.payoutFailedCount} out</span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminOverview;
