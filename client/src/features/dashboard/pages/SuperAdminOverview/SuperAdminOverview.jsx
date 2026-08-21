import React, { useState, useEffect } from 'react';
import './SuperAdminOverview.css';
import api from '../../../../services/apiClient';
import { FiActivity, FiTrendingUp, FiDownload, FiDollarSign, FiUsers, FiAward } from 'react-icons/fi';
import './SuperAdminOverview.css'; 

const SuperAdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(7);
  const [customDates, setCustomDates] = useState({ startDate: '', endDate: '' });
  
  const [data, setData] = useState({
    upstream: { balance: 0, status: 'loading' },
    todayMetrics: {
      payins: { amount: 0, commission: 0, count: 0 },
      payouts: { amount: 0, commission: 0, count: 0 }
    },
    yesterdayMetrics: {
      payins: { amount: 0, commission: 0, count: 0 },
      payouts: { amount: 0, commission: 0, count: 0 }
    }
  });

  const [analytics, setAnalytics] = useState({
    topMerchants: [],
    allMerchantsStats: []
  });

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  useEffect(() => {
    // Only auto-fetch if it's not custom, or if both custom dates are present
    if (daysFilter !== 'custom' || (customDates.startDate && customDates.endDate)) {
      fetchAnalytics();
    }
  }, [daysFilter, customDates.startDate, customDates.endDate]);

  const fetchSystemHealth = async () => {
    try {
      const res = await api.get('/v1/gateway/system/health');
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let url = `/dashboard/admin/analytics?days=${daysFilter}`;
      if (daysFilter === 'custom' && customDates.startDate && customDates.endDate) {
        url = `/dashboard/admin/analytics?startDate=${customDates.startDate}&endDate=${customDates.endDate}`;
      }
      const res = await api.get(url);
      if(res.data.success) {
        setAnalytics({
          topMerchants: res.data.topMerchants,
          allMerchantsStats: res.data.allMerchantsStats
        });
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfit = (metrics) => {
    return (metrics.payins.commission || 0) + (metrics.payouts.commission || 0);
  };

  if (loading && analytics.topMerchants.length === 0) return <div className="loading-spinner">Loading SuperAdmin Dashboard...</div>;

  const todayProfit = calculateProfit(data.todayMetrics);
  const yesterdayProfit = calculateProfit(data.yesterdayMetrics);

  return (
    <div className="payment-page">
      <div className="payment-filters">
        <h3 style={{ margin: 0, color: '#1e293b' }}>SuperAdmin Dashboard</h3>
        <button className="btn-primary" onClick={() => { fetchSystemHealth(); fetchAnalytics(); }}>
          Refresh Metrics
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, color: '#475569' }}>Today's Payin Volume</h4>
            <FiTrendingUp color="#3b82f6" />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>
              ₹{data.todayMetrics.payins.amount.toLocaleString('en-IN')}
            </h3>
            <small style={{ color: '#10b981', fontWeight: 'bold' }}>{data.todayMetrics.payins.count} Successful Links</small>
          </div>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, color: '#475569' }}>Today's Payout Volume</h4>
            <FiDownload color="#f59e0b" />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>
              ₹{data.todayMetrics.payouts.amount.toLocaleString('en-IN')}
            </h3>
            <small style={{ color: '#10b981', fontWeight: 'bold' }}>{data.todayMetrics.payouts.count} Successful Payouts</small>
          </div>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, color: '#475569' }}>Today's Gross Profit</h4>
            <FiDollarSign color="#10b981" />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '28px', color: '#10b981' }}>
              ₹{todayProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </h3>
            <small style={{ color: '#64748b' }}>Yesterday: ₹{yesterdayProfit.toLocaleString('en-IN')}</small>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        {/* Leaderboard */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiAward color="#f59e0b" /> Top Users
            </h4>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select 
                value={daysFilter} 
                onChange={(e) => setDaysFilter(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value={3}>Last 3 Days</option>
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
              
              {daysFilter === 'custom' && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="date" 
                    value={customDates.startDate}
                    onChange={(e) => setCustomDates(p => ({ ...p, startDate: e.target.value }))}
                    style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <span>-</span>
                  <input 
                    type="date" 
                    value={customDates.endDate}
                    onChange={(e) => setCustomDates(p => ({ ...p, endDate: e.target.value }))}
                    style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {analytics.topMerchants.map((merchant, index) => (
              <div key={merchant._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: index < 4 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b' }}>
                    #{index + 1}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>{merchant.merchant.name}</p>
                    <small style={{ color: '#94a3b8' }}>{merchant.txCount} txns</small>
                  </div>
                </div>
                <h4 style={{ margin: 0, color: '#3b82f6' }}>₹{merchant.totalVolume.toLocaleString('en-IN')}</h4>
              </div>
            ))}
            {analytics.topMerchants.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center' }}>No data for selected period</p>}
          </div>
        </div>

        {/* All Users Performance Table */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 24px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiUsers color="#3b82f6" /> User Performance List (Lifetime)
          </h4>
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', color: '#64748b' }}>Merchant</th>
                  <th style={{ padding: '12px', color: '#64748b' }}>Total Links Created</th>
                  <th style={{ padding: '12px', color: '#64748b' }}>Total Payin Volume</th>
                  <th style={{ padding: '12px', color: '#64748b' }}>Total Payout Volume</th>
                </tr>
              </thead>
              <tbody>
                {analytics.allMerchantsStats.map((stat) => (
                  <tr key={stat._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>
                      <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>{stat.merchant.name}</p>
                      <small style={{ color: '#94a3b8' }}>{stat.merchant.email}</small>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                        {stat.totalLinksCreated}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#10b981' }}>
                      ₹{stat.totalPayinAmount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#f59e0b' }}>
                      ₹{stat.totalPayoutAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminOverview;
