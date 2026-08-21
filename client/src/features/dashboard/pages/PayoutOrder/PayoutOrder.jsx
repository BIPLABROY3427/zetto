import React, { useState, useEffect } from 'react';
import api from '../../../../services/apiClient';
import { toast } from 'react-toastify';
import './PayoutOrder.css';
import { FiPlus } from 'react-icons/fi';

const PayoutOrder = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/transactions', {
        params: { type: 'withdrawal', search, status }
      });
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch Payout Orders');
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

  const handleCreatePayout = async (e) => {
    e.preventDefault();
    if (!amount || amount < 100) {
      return toast.error('Minimum amount is 100 INR');
    }
    if (!accountNumber || !ifscCode || !accountName) {
      return toast.error('Please fill all bank details');
    }

    try {
      setCreating(true);
      const payload = {
        amount: Number(amount),
        description: description || 'Manual Payout Request',
        bankDetails: {
          accountNumber,
          ifscCode,
          accountName
        }
      };

      const res = await api.post('/v1/gateway/payout', payload);
      
      if (res.data.success) {
        toast.success('Payout request created successfully!');
        setIsModalOpen(false);
        // Reset form
        setAmount('');
        setAccountNumber('');
        setIfscCode('');
        setAccountName('');
        setDescription('');
        fetchTransactions(); // Refresh the list
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create payout');
    } finally {
      setCreating(false);
    }
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

        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <FiPlus /> Create Payout Request
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

      {/* CREATE PAYOUT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" style={overlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <h2 style={{ marginTop: 0 }}>Request Payout</h2>
            
            <form onSubmit={handleCreatePayout}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Amount (INR)</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  required 
                  min="100"
                  style={inputStyle} 
                  placeholder="Min 100"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Account Number</label>
                <input 
                  type="text" 
                  value={accountNumber} 
                  onChange={e => setAccountNumber(e.target.value)} 
                  required 
                  style={inputStyle} 
                  placeholder="E.g. 1234567890"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>IFSC Code</label>
                <input 
                  type="text" 
                  value={ifscCode} 
                  onChange={e => setIfscCode(e.target.value)} 
                  required 
                  style={inputStyle} 
                  placeholder="E.g. SBIN0001234"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Account Holder Name</label>
                <input 
                  type="text" 
                  value={accountName} 
                  onChange={e => setAccountName(e.target.value)} 
                  required 
                  style={inputStyle} 
                  placeholder="E.g. John Doe"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Description (Optional)</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  style={inputStyle} 
                  placeholder="E.g. Vendor Payment"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating} style={{ padding: '8px 16px' }}>
                  {creating ? 'Processing...' : 'Submit Request'}
                </button>
              </div>
            </form>
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

export default PayoutOrder;
