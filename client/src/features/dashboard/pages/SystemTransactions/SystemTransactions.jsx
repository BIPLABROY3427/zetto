import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/apiClient';
import { toast } from 'react-toastify';
import { FiSearch, FiRefreshCw, FiEye, FiRotateCw, FiX, FiDatabase } from 'react-icons/fi';
import './SystemTransactions.css';

const statusClass = (s) => {
  if (s === 'completed' || s === 'sent' || s === 'success') return 'pg-status pg-status-completed';
  if (s === 'pending') return 'pg-status pg-status-pending';
  return 'pg-status pg-status-failed';
};

const SystemTransactions = ({ initialType = 'all' }) => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState(initialType);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => { setType(initialType); }, [initialType]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/admin/transactions', { params: { type, search, status } });
      setData(res.data.data || []);
    } catch { toast.error('Failed to fetch transactions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTransactions(); }, [status, type]);

  const handleSearch = (e) => { e.preventDefault(); fetchTransactions(); };

  const handleResendWebhook = async (id) => {
    try {
      const res = await api.post(`/dashboard/transactions/${id}/resend-webhook`, {}, { hideErrorToast: true });
      if (res.data.success) { toast.success(`Webhook resent!`); fetchTransactions(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to resend webhook'); }
  };

  return (
    <div className="pg-root">
      <div className="pg-toolbar">
        <form className="pg-filters" onSubmit={handleSearch}>
          <div className="st-search-wrap">
            <FiSearch className="st-search-icon" />
            <input type="text" className="pg-input st-search-input"
              placeholder="Search order ID..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="pg-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select className="pg-select" value={type} onChange={e => setType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="payment">PayIn</option>
            <option value="withdrawal">PayOut</option>
          </select>
          <button type="submit" className="pg-btn pg-btn-secondary"><FiSearch /> Search</button>
          <button type="button" className="pg-btn pg-btn-secondary" onClick={fetchTransactions}><FiRefreshCw /></button>
        </form>
      </div>

      <div className="pg-card">
        <div className="pg-card-header">
          <h4 className="pg-card-title">
            <span className="pg-card-title-icon"><FiDatabase /></span>
            System Transactions
          </h4>
          <span className="tk-count">{data.length} records</span>
        </div>
        <div className="pg-table-wrap">
          {loading ? (
            <div className="pg-loading"><FiRefreshCw /> Loading...</div>
          ) : (
            <table className="pg-table">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>Type</th>
                  <th>Order ID</th>
                  <th>Amount</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Webhook</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan="9"><div className="pg-empty"><p>No transactions found</p></div></td></tr>
                ) : data.map(tx => (
                  <tr key={tx._id}>
                    <td>
                      <div className="st-merchant" onClick={() => navigate(`/dashboard/users/${tx.merchantId?._id}`)}>
                        <span className="st-merchant-name">{tx.merchantId?.name || 'Unknown'}</span>
                        <span className="st-merchant-email">{tx.merchantId?.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`pg-badge ${tx.type === 'payment' ? 'pg-badge-blue' : 'pg-badge-amber'}`}>
                        {tx.type === 'payment' ? 'PayIn' : 'PayOut'}
                      </span>
                    </td>
                    <td className="st-order-id">{tx.transactionId}</td>
                    <td style={{ fontWeight: 700 }}>₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                    <td className="st-details">
                      {tx.type === 'payment' ? (
                        tx.paymentUrl ? <a href={tx.paymentUrl} target="_blank" rel="noreferrer" className="st-link">Link ↗</a> : '-'
                      ) : (
                        tx.customerDetails?.accountNumber
                          ? <span>{tx.customerDetails.accountNumber} / {tx.customerDetails.ifscCode}</span>
                          : '-'
                      )}
                    </td>
                    <td><span className={statusClass(tx.status)}>{tx.status}</span></td>
                    <td><span className={statusClass(tx.webhookStatus || 'pending')}>{tx.webhookStatus || 'pending'}</span></td>
                    <td className="st-date">{new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td>
                      <div className="st-actions">
                        <button className="pg-btn pg-btn-secondary pg-btn-sm" onClick={() => setSelectedTx(tx)}><FiEye /></button>
                        <button className="pg-btn pg-btn-secondary pg-btn-sm" onClick={() => handleResendWebhook(tx._id)} title="Resend Webhook"><FiRotateCw /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Full Payload Modal */}
      {selectedTx && (
        <div className="pg-modal-backdrop" onClick={e => e.target === e.currentTarget && setSelectedTx(null)}>
          <div className="pg-modal pg-modal-lg">
            <div className="pg-modal-header">
              <h3 className="pg-modal-title"><FiDatabase style={{ marginRight: 8 }} /> Transaction Payload</h3>
              <button className="pg-modal-close" onClick={() => setSelectedTx(null)}><FiX /></button>
            </div>
            <div className="pg-modal-body">
              <pre className="st-payload-pre">{JSON.stringify(selectedTx, null, 2)}</pre>
            </div>
            <div className="pg-modal-footer">
              <button className="pg-btn pg-btn-secondary" onClick={() => setSelectedTx(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemTransactions;
