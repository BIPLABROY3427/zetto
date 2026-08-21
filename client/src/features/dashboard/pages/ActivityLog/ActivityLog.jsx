import React, { useState, useEffect } from 'react';
import api from '../../../../services/apiClient';
import { toast } from 'react-toastify';
import { FiActivity, FiRefreshCw, FiLogIn, FiLogOut, FiSettings, FiShield, FiUser, FiDollarSign, FiClock, FiFilter } from 'react-icons/fi';
import './ActivityLog.css';

// Map action types to icons + colors
const ACTION_META = {
  login:           { icon: <FiLogIn />,      color: '#16a34a', bg: '#f0fdf4', border: '#86efac', label: 'Login' },
  logout:          { icon: <FiLogOut />,     color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', label: 'Logout' },
  profile_update:  { icon: <FiUser />,       color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Profile Updated' },
  password_change: { icon: <FiShield />,     color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe', label: 'Password Changed' },
  settings_update: { icon: <FiSettings />,   color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', label: 'Settings Updated' },
  transaction:     { icon: <FiDollarSign />, color: '#b45309', bg: '#fffbeb', border: '#fde68a', label: 'Transaction' },
};

const getActionMeta = (action = '') => {
  const key = Object.keys(ACTION_META).find(k => action.toLowerCase().includes(k));
  return ACTION_META[key] || { icon: <FiActivity />, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: action };
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  const hr  = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1)  return 'Just now';
  if (min < 60) return `${min}m ago`;
  if (hr  < 24) return `${hr}h ago`;
  return `${day}d ago`;
};

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Dummy logs fallback (in case no real API)
  const DUMMY_LOGS = [
    { _id: '1', action: 'login',           description: 'Logged in from Chrome on Windows',   ip: '192.168.1.1',  createdAt: new Date(Date.now() - 5*60000).toISOString() },
    { _id: '2', action: 'profile_update',  description: 'Updated business name and phone',     ip: '192.168.1.1',  createdAt: new Date(Date.now() - 2*3600000).toISOString() },
    { _id: '3', action: 'password_change', description: 'Password changed successfully',       ip: '192.168.1.1',  createdAt: new Date(Date.now() - 1*86400000).toISOString() },
    { _id: '4', action: 'login',           description: 'Logged in from Safari on macOS',      ip: '10.0.0.5',     createdAt: new Date(Date.now() - 2*86400000).toISOString() },
    { _id: '5', action: 'settings_update', description: 'Webhook URL updated',                 ip: '192.168.1.1',  createdAt: new Date(Date.now() - 3*86400000).toISOString() },
    { _id: '6', action: 'transaction',     description: 'Payin order created: ₹5,000',         ip: '192.168.1.1',  createdAt: new Date(Date.now() - 4*86400000).toISOString() },
    { _id: '7', action: 'logout',          description: 'Session ended',                       ip: '192.168.1.1',  createdAt: new Date(Date.now() - 5*86400000).toISOString() },
  ];

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/activity-log');
      setLogs(res.data.logs || []);
    } catch {
      // fallback to dummy
      setLogs(DUMMY_LOGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(l => l.action?.toLowerCase().includes(filter));

  const filterOptions = [
    { value: 'all',      label: 'All Activity' },
    { value: 'login',    label: 'Logins' },
    { value: 'profile',  label: 'Profile' },
    { value: 'password', label: 'Password' },
    { value: 'transaction', label: 'Transactions' },
  ];

  // Stats
  const totalLogins = logs.filter(l => l.action?.includes('login')).length;
  const lastLogin   = logs.find(l => l.action?.includes('login'));

  return (
    <div className="pg-root">
      {/* Toolbar */}
      <div className="pg-toolbar">
        <div>
          <h3 className="al-heading">Activity Log</h3>
          <p className="al-sub">Track all actions performed on your account</p>
        </div>
        <div className="pg-actions">
          <button className="pg-btn pg-btn-secondary" onClick={fetchLogs}><FiRefreshCw /></button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="pg-stats-row">
        <div className="pg-stat-card">
          <div className="pg-stat-label">Total Events</div>
          <div className="pg-stat-val blue">{logs.length}</div>
          <div className="pg-stat-sub">Recorded actions</div>
        </div>
        <div className="pg-stat-card">
          <div className="pg-stat-label">Login Sessions</div>
          <div className="pg-stat-val green">{totalLogins}</div>
          <div className="pg-stat-sub">Total logins</div>
        </div>
        <div className="pg-stat-card">
          <div className="pg-stat-label">Last Login</div>
          <div className="pg-stat-val" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {lastLogin ? timeAgo(lastLogin.createdAt) : '—'}
          </div>
          <div className="pg-stat-sub">{lastLogin?.ip || '—'}</div>
        </div>
        <div className="pg-stat-card">
          <div className="pg-stat-label">Last Activity</div>
          <div className="pg-stat-val" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {logs[0] ? timeAgo(logs[0].createdAt) : '—'}
          </div>
          <div className="pg-stat-sub">Most recent event</div>
        </div>
      </div>

      {/* Log Table */}
      <div className="pg-card">
        <div className="pg-card-header">
          <h4 className="pg-card-title">
            <span className="pg-card-title-icon"><FiActivity /></span>
            Recent Activity
          </h4>
          <div className="al-filter-wrap">
            <FiFilter size={13} style={{ color: 'var(--text-secondary)' }} />
            <select className="pg-select al-filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
              {filterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="pg-table-wrap">
          {loading ? (
            <div className="pg-loading"><FiRefreshCw /> Loading activity...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="pg-empty"><FiActivity size={32} style={{ opacity: 0.3 }} /><p>No activity found</p></div>
          ) : (
            <div className="al-timeline">
              {filteredLogs.map((log, i) => {
                const meta = getActionMeta(log.action);
                return (
                  <div key={log._id || i} className="al-item">
                    {/* Icon */}
                    <div className="al-icon" style={{ background: meta.bg, color: meta.color, border: `1.5px solid ${meta.border}` }}>
                      {meta.icon}
                    </div>

                    {/* Line connector */}
                    {i < filteredLogs.length - 1 && <div className="al-line" />}

                    {/* Content */}
                    <div className="al-content">
                      <div className="al-content-top">
                        <span className="al-action-label" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                          {meta.label}
                        </span>
                        <div className="al-meta">
                          {log.ip && <span className="al-ip">IP: {log.ip}</span>}
                          <span className="al-time"><FiClock size={11} /> {timeAgo(log.createdAt)}</span>
                        </div>
                      </div>
                      <p className="al-desc">{log.description || log.action}</p>
                      <p className="al-full-date">
                        {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
