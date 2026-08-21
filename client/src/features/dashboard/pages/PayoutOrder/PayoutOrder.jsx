import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../../services/apiClient';
import {
  FiPlus, FiSearch, FiRefreshCw, FiArrowUpRight, FiX, FiSend
} from 'react-icons/fi';
import './PayoutOrder.css';

const statusClass = (s) => {
  if (s === 'completed' || s === 'success') return 'pg-status pg-status-completed';
  if (s === 'pending') return 'pg-status pg-status-pending';
  return 'pg-status pg-status-failed';
};

const PayoutOrder = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  // Modal
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
      setData(res.data.data || []);
    } catch {
      toast.error('Failed to fetch Payout Orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [status]);

  const handleSearch = (e) => { e.preventDefault(); fetchTransactions(); };

  const resetForm = () => {
    setAmount(''); setAccountNumber(''); setIfscCode('');
    setAccountName(''); setDescription('');
  };

  const handleCreatePayout = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) < 100) return toast.error('Minimum amount is ₹100');
    if (!accountNumber || !ifscCode || !accountName) return toast.error('Please fill all bank details');
    try {
      setCreating(true);
      const res = await api.post('/v1/gateway/payout', {
        amount: Number(amount),
        description: description || 'Manual Payout Request',
        bankDetails: { accountNumber, ifscCode, accountName }
      });
      if (res.data.success) {
        toast.success('Payout request submitted!');
        setIsModalOpen(false);
        resetForm();
        fetchTransactions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create payout');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="pg-root">
      {/* Toolbar */}
      <div className="pg-toolbar">
        <form className="pg-filters" onSubmit={handleSearch}>
          <div className="pout-search-wrap">
            <FiSearch className="pout-search-icon" />
            <input
              type="text"
              className="pg-input pout-search-input"
              placeholder="Search order ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="pg-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <button type="submit" className="pg-btn pg-btn-secondary">
            <FiSearch /> Search
          </button>
          <button type="button" className="pg-btn pg-btn-secondary" onClick={fetchTransactions}>
            <FiRefreshCw />
          </button>
        </form>
        <div className="pg-actions">
          <button className="pg-btn pg-btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <FiPlus /> Create Payout Request
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="pg-card">
        <div className="pg-card-header">
          <h4 className="pg-card-title">
            <span className="pg-card-title-icon"><FiArrowUpRight /></span>
            Payout Orders
          </h4>
          <span className="pout-count-badge">{data.length} records</span>
        </div>
        <div className="pg-table-wrap">
          {loading ? (
            <div className="pg-loading"><FiRefreshCw className="spin" /> Loading...</div>
          ) : (
            <table className="pg-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan="5">
                    <div className="pg-empty"><p>No payout orders found</p></div>
                  </td></tr>
                ) : data.map(tx => (
                  <tr key={tx._id}>
                    <td className="pout-order-id">{tx.transactionId}</td>
                    <td className="pout-amount">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                    <td><span className="pg-badge pg-badge-inr">INR</span></td>
                    <td><span className={statusClass(tx.status)}>{tx.status}</span></td>
                    <td className="pout-date">{new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Payout Modal */}
      {isModalOpen && (
        <div className="pg-modal-backdrop" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="pg-modal">
            <div className="pg-modal-header">
              <h3 className="pg-modal-title">
                <FiSend style={{ marginRight: 8, color: 'var(--primary)' }} />
                Request Payout
              </h3>
              <button className="pg-modal-close" onClick={() => setIsModalOpen(false)}><FiX /></button>
            </div>
            <form onSubmit={handleCreatePayout}>
              <div className="pg-modal-body pg-form">
                <div className="pg-form-row">
                  <label className="pg-label"><span className="pg-label-req">*</span> Amount (INR)</label>
                  <input type="number" min="100" required className="pg-field"
                    placeholder="Minimum ₹100" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div className="pg-form-row-2">
                  <div className="pg-form-row">
                    <label className="pg-label"><span className="pg-label-req">*</span> Account Number</label>
                    <input type="text" required className="pg-field"
                      placeholder="e.g. 1234567890" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
                  </div>
                  <div className="pg-form-row">
                    <label className="pg-label"><span className="pg-label-req">*</span> IFSC Code</label>
                    <input type="text" required className="pg-field"
                      placeholder="e.g. SBIN0001234" value={ifscCode} onChange={e => setIfscCode(e.target.value.toUpperCase())} />
                  </div>
                </div>
                <div className="pg-form-row">
                  <label className="pg-label"><span className="pg-label-req">*</span> Account Holder Name</label>
                  <input type="text" required className="pg-field"
                    placeholder="e.g. John Doe" value={accountName} onChange={e => setAccountName(e.target.value)} />
                </div>
                <div className="pg-form-row">
                  <label className="pg-label">Description (Optional)</label>
                  <input type="text" className="pg-field"
                    placeholder="e.g. Vendor Payment" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
              </div>
              <div className="pg-modal-footer">
                <button type="button" className="pg-btn pg-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="pg-btn pg-btn-primary" disabled={creating}>
                  {creating ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutOrder;
