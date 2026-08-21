import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../services/apiClient';
import { toast } from 'react-toastify';
import {
  FiArrowLeft, FiUser, FiDollarSign, FiSettings,
  FiArrowDownLeft, FiArrowUpRight
} from 'react-icons/fi';
import './UserProfileDetails.css';

const statusClass = (s) => {
  if (s === 'completed' || s === 'success') return 'pg-status pg-status-completed';
  if (s === 'pending') return 'pg-status pg-status-pending';
  return 'pg-status pg-status-failed';
};

const UserProfileDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const usersRes = await api.get('/users');
        const found = usersRes.data.users.find(u => u._id === id);
        if (!found) { toast.error('User not found'); return; }
        setUser(found);
        const txRes = await api.get(`/users/${id}/transactions`);
        setTransactions(txRes.data.data || []);
      } catch { toast.error('Failed to load user details'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <div className="pg-root"><div className="pg-loading">Loading profile...</div></div>;
  if (!user)   return <div className="pg-root"><div className="pg-empty"><p>User not found</p></div></div>;

  const initials = (user.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="pg-root">
      <div className="pg-toolbar">
        <button className="pg-btn pg-btn-secondary" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back
        </button>
      </div>

      {/* User Header */}
      <div className="pg-card upd-header-card">
        <div className="upd-avatar">{initials}</div>
        <div className="upd-meta">
          <h2 className="upd-name">
            {user.name}
            {user.isVip && <span className="upd-vip-badge">VIP 👑</span>}
          </h2>
          <p className="upd-email">{user.email}</p>
          <div className="upd-tags">
            <span className={`pg-status ${user.isActive ? 'pg-status-completed' : 'pg-status-failed'}`}>
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="prf-role-badge">{user.role || 'user'}</span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="upd-info-grid">
        {/* Personal */}
        <div className="pg-card">
          <div className="pg-card-header">
            <h4 className="pg-card-title"><span className="pg-card-title-icon"><FiUser /></span> Personal Info</h4>
          </div>
          <div className="pg-card-body">
            {[
              ['Email', user.email],
              ['Phone', user.phoneNumber || 'N/A'],
              ['Business', user.businessName || 'N/A'],
              ['Website', user.website || 'N/A'],
            ].map(([k, v]) => (
              <div key={k} className="pg-info-item">
                <span className="pg-info-label">{k}</span>
                <span className="pg-info-value">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financials */}
        <div className="pg-card">
          <div className="pg-card-header">
            <h4 className="pg-card-title"><span className="pg-card-title-icon"><FiDollarSign /></span> Financials</h4>
          </div>
          <div className="pg-card-body">
            {[
              ['Wallet Balance', `₹${(user.walletBalance || 0).toLocaleString('en-IN')}`],
              ['Payout Balance', `₹${(user.payoutBalance || 0).toLocaleString('en-IN')}`],
              ['Frozen Amount', `₹${(user.frozenAmount || 0).toLocaleString('en-IN')}`],
              ['Frozen Reason', user.frozenReason || 'None'],
            ].map(([k, v]) => (
              <div key={k} className="pg-info-item">
                <span className="pg-info-label">{k}</span>
                <span className="pg-info-value">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="pg-card">
          <div className="pg-card-header">
            <h4 className="pg-card-title"><span className="pg-card-title-icon"><FiSettings /></span> Services & Commission</h4>
          </div>
          <div className="pg-card-body">
            {[
              ['Payin Enabled', user.isPayinEnabled ? 'Yes ✓' : 'No ✗'],
              ['Payout Enabled', user.isPayoutEnabled ? 'Yes ✓' : 'No ✗'],
              ['Payin Commission', `${user.commission?.payin?.percent || 0}% + ₹${user.commission?.payin?.flat || 0}`],
              ['Payout Commission', `${user.commission?.payout?.percent || 0}% + ₹${user.commission?.payout?.flat || 0}`],
            ].map(([k, v]) => (
              <div key={k} className="pg-info-item">
                <span className="pg-info-label">{k}</span>
                <span className="pg-info-value">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="pg-card">
        <div className="pg-card-header">
          <h4 className="pg-card-title">
            <span className="pg-card-title-icon"><FiArrowDownLeft /></span>
            Recent Transactions
          </h4>
          <span className="tk-count">{transactions.length} records</span>
        </div>
        <div className="pg-table-wrap">
          {transactions.length === 0 ? (
            <div className="pg-empty"><p>No transactions for this user</p></div>
          ) : (
            <table className="pg-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Transaction ID</th>
                  <th>Status</th>
                  <th>Webhook</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx._id}>
                    <td>
                      <span className={`pg-badge ${tx.type === 'payment' ? 'pg-badge-blue' : 'pg-badge-amber'}`}>
                        {tx.type === 'payment' ? <><FiArrowDownLeft /> Payin</> : <><FiArrowUpRight /> Payout</>}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary)' }}>{tx.transactionId}</td>
                    <td><span className={statusClass(tx.status)}>{tx.status}</span></td>
                    <td><span className={statusClass(tx.webhookStatus || 'pending')}>{tx.webhookStatus || 'pending'}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileDetails;
