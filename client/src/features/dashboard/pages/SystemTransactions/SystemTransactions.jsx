import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/apiClient';
import { toast } from 'react-toastify';
import './SystemTransactions.css';

const SystemTransactions = ({ initialType = 'all' }) => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState(initialType);
  
  // Modal States
  const [selectedTx, setSelectedTx] = useState(null); // For Full Payload Modal

  // Update type when initialType prop changes (for route changes)
  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/admin/transactions', {
        params: { type, search, status }
      });
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch Payin Orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [status, type]); // refetch on status/type change

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleOpenUserModal = (merchantId) => {
    if (!merchantId || !merchantId._id) return;
    navigate(`/dashboard/users/${merchantId._id}`);
  };

  const handleResendWebhook = async (id) => {
    try {
      const res = await api.post(`/dashboard/transactions/${id}/resend-webhook`, {}, { hideErrorToast: true });
      if (res.data.success) {
        toast.success(`Webhook resent! Status: ${res.data.webhookStatus}`);
        fetchTransactions(); // Refresh status
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend webhook');
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-filters">
        <form onSubmit={handleSearch} className="filter-form">
          <input 
            type="text" 
            placeholder="Search Order No..." 
            className="form-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All States</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select 
            className="form-control"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="payment">PayIn</option>
            <option value="withdrawal">PayOut</option>
          </select>
          <button type="submit" className="btn-primary">Query</button>
        </form>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">Loading Data...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Merchant</th>
                <th>Type</th>
                <th>Order No</th>
                <th>Amount</th>
                <th>Details</th>
                <th>Order State</th>
                <th>Webhook</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan="9" className="text-center">No Data</td></tr>
              ) : (
                data.map(tx => (
                  <tr key={tx._id}>
                    <td>
                      <div 
                        onClick={() => handleOpenUserModal(tx.merchantId)} 
                        style={{ cursor: 'pointer', color: '#2563eb' }}
                      >
                        <strong>{tx.merchantId?.name || 'Unknown'}</strong><br/>
                        <small style={{ color: '#64748b' }}>{tx.merchantId?.email}</small>
                      </div>
                    </td>
                    <td>
                      <span className="currency-badge">{tx.type}</span>
                    </td>
                    <td>{tx.transactionId}</td>
                    <td>₹{tx.amount}</td>
                    <td>
                      {tx.type === 'payment' ? (
                        <div style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.paymentUrl ? (
                            <a href={tx.paymentUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Link</a>
                          ) : '-'}
                          {tx.upiId && <div style={{ fontSize: '12px', color: '#64748b' }}>{tx.upiId}</div>}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {tx.customerDetails?.accountNumber ? (
                            <>
                              <div>A/c: {tx.customerDetails.accountNumber}</div>
                              <div>IFSC: {tx.customerDetails.ifscCode}</div>
                            </>
                          ) : '-'}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${tx.status === 'completed' ? 'open' : 'close'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${tx.webhookStatus === 'sent' ? 'open' : (tx.webhookStatus === 'failed' ? 'close' : 'pending')}`}>
                        {tx.webhookStatus || 'pending'}
                      </span>
                    </td>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => setSelectedTx(tx)}
                        >
                          View
                        </button>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => handleResendWebhook(tx._id)}
                        >
                          Resend Webhook
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* FULL PAYLOAD MODAL */}
      {selectedTx && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '800px',
            maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem' }}>Transaction Payload</h2>
              <button onClick={() => setSelectedTx(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            </div>
            
            <pre style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '14px', border: '1px solid #e2e8f0' }}>
              {JSON.stringify(selectedTx, null, 2)}
            </pre>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setSelectedTx(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SystemTransactions;
