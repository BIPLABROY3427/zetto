import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../../services/apiClient';
import './PayinOrder.css';
import { FiPlus } from 'react-icons/fi';

const PayinOrder = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [paymentLink, setPaymentLink] = useState(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/transactions', {
        params: { type: 'payment', search, status }
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
  }, [status]); // refetch on status change

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!amount || amount < 200) {
      return toast.error('Minimum amount is 200 INR');
    }

    try {
      setCreating(true);
      const payload = {
        amount: Number(amount),
        description: description || 'Manual Payment Link',
        customerDetails: {
          name: 'Manual User',
          email: 'manual@example.com'
        }
      };

      // Call the gateway payment API (which now supports JWT auth)
      const res = await api.post('/v1/gateway/payment', payload);
      
      if (res.data.success) {
        toast.success('Payment Link created successfully!');
        setPaymentLink(res.data.paymentUrl);
        fetchTransactions(); // Refresh the list
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create payment link');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="payment-page">
      <div className="payment-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <button type="submit" className="btn-primary">Query</button>
        </form>

        <button className="btn-primary" onClick={() => { setIsModalOpen(true); setPaymentLink(null); }}>
          <FiPlus /> Create Payment Link
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">Loading Data...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order No</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Order State</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan="5" className="text-center">No Data</td></tr>
              ) : (
                data.map(tx => (
                  <tr key={tx._id}>
                    <td>{tx.transactionId}</td>
                    <td>{tx.amount}</td>
                    <td><span className="currency-badge">INR</span></td>
                    <td>
                      <span className={`status-badge ${tx.status === 'completed' ? 'open' : 'close'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE PAYMENT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" style={overlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <h2 style={{ marginTop: 0 }}>Create Payment Link</h2>
            
            {paymentLink ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <div style={{ color: '#10b981', fontSize: '18px', marginBottom: '15px' }}>Link Generated Successfully!</div>
                <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px', wordBreak: 'break-all', marginBottom: '15px', fontSize: '13px' }}>
                  {paymentLink}
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button className="btn-primary" onClick={() => copyToClipboard(paymentLink)}>Copy Link</button>
                  <button onClick={() => { setIsModalOpen(false); setPaymentLink(null); }} style={cancelBtnStyle}>Close</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreatePayment}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Amount (INR)</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    required 
                    min="200"
                    style={inputStyle} 
                    placeholder="Min 200"
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Description (Optional)</label>
                  <input 
                    type="text" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    style={inputStyle} 
                    placeholder="E.g. Invoice #123"
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={creating} style={{ padding: '8px 16px' }}>
                    {creating ? 'Creating...' : 'Generate Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Inline styles for modals
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
  justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const modalContentStyle = {
  background: '#ffffff', borderRadius: '12px', width: '100%',
  maxWidth: '400px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
};
const labelStyle = { display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 };
const inputStyle = {
  width: '100%', padding: '10px', borderRadius: '8px',
  border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px'
};
const cancelBtnStyle = {
  padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1',
  borderRadius: '8px', color: '#475569', cursor: 'pointer', fontWeight: 500
};

export default PayinOrder;
