import { useEffect, useState } from 'react';
import {
  FiArrowDownLeft,
  FiCheck,
  FiCopy,
  FiDownload,
  FiLink,
  FiPlus,
  FiRefreshCw,
  FiRotateCw,
  FiSearch,
  FiX
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import Pagination from '../../../../components/ui/Pagination/Pagination';
import api from '../../../../services/apiClient';
import { exportToCsv } from '../../../../utils/exportCsv';
import './PayinOrder.css';

const statusClass = (s) => {
  if (s === 'completed' || s === 'success') return 'pg-status pg-status-completed';
  if (s === 'pending') return 'pg-status pg-status-pending';
  return 'pg-status pg-status-failed';
};

const PayinOrder = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [paymentLink, setPaymentLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/transactions', {
        params: { type: 'payment', search, status, page, limit }
      });
      setData(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to fetch Payins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [status, page, limit]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchTransactions(); };

  const handleExport = () => {
    const exportData = data.map(tx => ({
      'Order ID': tx.transactionId,
      'Amount': tx.amount,
      'Currency': 'INR',
      'Status': tx.status,
      'Webhook Status': tx.webhookStatus,
      'Date': new Date(tx.createdAt).toLocaleString()
    }));
    exportToCsv(exportData, 'Payins_Export');
  };

  const handleSyncStatus = async (orderNo) => {
    const toastId = toast.loading('Syncing with gateway...');
    try {
      const res = await api.get('/v1/gateway/payin/query', { params: { orderNo } });
      toast.dismiss(toastId);
      if (res.data.success) {
        toast.success(`Status updated: ${res.data.status}`);
        fetchTransactions();
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Failed to sync status');
    }
  };

  const handleResendWebhook = async (id) => {
    const toastId = toast.loading('Resending webhook...');
    try {
      const res = await api.post(`/dashboard/transactions/${id}/resend-webhook`);
      toast.dismiss(toastId);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchTransactions();
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Failed to resend webhook');
    }
  };



  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) < 200) return toast.error('Minimum amount is ₹200');
    try {
      setCreating(true);
      const res = await api.post('/v1/gateway/payment', {
        amount: Number(amount),
        description: description || 'Manual Payment Link',
        customerDetails: { name: 'Manual User', email: 'manual@example.com' }
      });
      if (res.data.success) {
        toast.success('Payment link created!');
        setPaymentLink(res.data.paymentUrl);
        fetchTransactions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create payment link');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
    if (!paymentLink) return;
    navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const openModal = () => {
    setPaymentLink(null);
    setAmount('');
    setDescription('');
    setCopied(false);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setPaymentLink(null); };

  return (
    <div className="pg-root">
      {/* Toolbar */}
      <div className="pg-toolbar">
        <div className="pg-filters">
          <select className="pg-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <form className="pg-search-form" onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <input type="text" className="pg-input po-search-input" placeholder="Search order ID..." value={search} onChange={e => setSearch(e.target.value)} />
            <button type="submit" className="pg-btn pg-btn-secondary"><FiSearch /></button>
          </form>
        </div>
        <div className="pg-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="pg-btn pg-btn-secondary" onClick={handleExport}>
            <FiDownload /> Export
          </button>
          <button className="pg-btn pg-btn-primary" onClick={openModal}>
            <FiPlus /> Create Payment Link
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="pg-card">
        <div className="pg-card-header">
          <h4 className="pg-card-title">
            <span className="pg-card-title-icon"><FiArrowDownLeft /></span>
            Payin Orders
          </h4>
          <span className="po-count-badge">{data.length} records</span>
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
                  <th>Tax/Fee</th>
                  <th>Payment Link</th>
                  <th>Status</th>
                  <th>Webhook</th>
                  <th>Date & Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan="8">
                    <div className="pg-empty"><p>No payin orders found</p></div>
                  </td></tr>
                ) : data.map(tx => (
                  <tr key={tx._id}>
                    <td className="po-order-id">
                      <div>{tx.transactionId}</div>
                      {tx.gatewayOrderId && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '2px', fontFamily: 'monospace' }}>
                          UTR: {tx.gatewayOrderId}
                        </div>
                      )}
                    </td>
                    <td className="po-amount">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                    <td className="po-amount" style={{ color: '#ef4444' }}>₹{Number(tx.commissionAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="po-payment-link">
                      {tx.paymentUrl ? (
                        <a href={tx.paymentUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                          <FiLink style={{ marginRight: '4px' }} />
                          View Link
                        </a>
                      ) : '-'}
                    </td>
                    <td><span className={statusClass(tx.status)}>{tx.status}</span></td>
                    <td>
                      <span className={statusClass(tx.webhookStatus || 'pending')}>
                        {tx.webhookStatus || 'pending'}
                      </span>
                    </td>
                    <td className="po-date">{new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {tx.status === 'pending' && (
                        <button
                          className="pg-btn pg-btn-secondary pg-btn-sm"
                          onClick={() => handleSyncStatus(tx.transactionId)}
                          title="Sync with Upstream"
                        >
                          <FiRefreshCw />
                        </button>
                      )}
                      {(tx.status === 'completed' || tx.status === 'failed') && (
                        <button
                          className="pg-btn pg-btn-secondary pg-btn-sm"
                          onClick={() => handleResendWebhook(tx._id)}
                          title="Resend Webhook"
                        >
                          <FiRotateCw />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
            />
          )}
        </div>
      </div>

      {/* Create Payment Modal */}
      {isModalOpen && (
        <div className="pg-modal-backdrop" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="pg-modal pg-modal-sm">
            <div className="pg-modal-header">
              <h3 className="pg-modal-title">
                <FiLink style={{ marginRight: 8, color: 'var(--primary)' }} />
                {paymentLink ? 'Link Generated!' : 'Create Payment Link'}
              </h3>
              <button className="pg-modal-close" onClick={closeModal}><FiX /></button>
            </div>

            {paymentLink ? (
              <div className="pg-modal-body">
                <div className="po-success-icon">✓</div>
                <p className="po-success-msg">Payment link created successfully!</p>
                <div className="po-link-box">{paymentLink}</div>
                <div className="pg-modal-footer" style={{ border: 'none', padding: '1rem 0 0' }}>
                  <button className="pg-btn pg-btn-secondary" onClick={closeModal}>Close</button>
                  <button className="pg-btn pg-btn-primary" onClick={copyLink}>
                    {copied ? <><FiCheck /> Copied!</> : <><FiCopy /> Copy Link</>}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreatePayment}>
                <div className="pg-modal-body pg-form">
                  <div className="pg-form-row">
                    <label className="pg-label"><span className="pg-label-req">*</span> Amount (INR)</label>
                    <input
                      type="number" min="200" required
                      className="pg-field"
                      placeholder="Minimum ₹200"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="pg-form-row">
                    <label className="pg-label">Description (Optional)</label>
                    <input
                      type="text"
                      className="pg-field"
                      placeholder="e.g. Invoice #123"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <div className="pg-modal-footer">
                  <button type="button" className="pg-btn pg-btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="pg-btn pg-btn-primary" disabled={creating}>
                    {creating ? <><span className="po-spin" />Generating...</> : 'Generate Link'}
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

export default PayinOrder;
