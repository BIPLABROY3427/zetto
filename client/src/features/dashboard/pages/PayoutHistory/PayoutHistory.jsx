import { useEffect, useState } from 'react';
import { FiArrowUpRight, FiDownload, FiRefreshCw, FiRotateCw, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Pagination from '../../../../components/ui/Pagination/Pagination';
import api from '../../../../services/apiClient';
import { exportToCsv } from '../../../../utils/exportCsv';
import './PayoutHistory.css';

const statusClass = (s) => {
  if (s === 'completed' || s === 'success' || s === 'sent') return 'pg-status pg-status-completed';
  if (s === 'pending' || s === 'queued' || s === 'pending_retry') return 'pg-status pg-status-pending';
  return 'pg-status pg-status-failed';
};

const PayoutHistory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/transactions', { params: { type: 'withdrawal', search, status, page, limit } });
      setData(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to fetch Payout History');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [status, page, limit]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchTransactions(); };

  const handleResendWebhook = async (id) => {
    try {
      const res = await api.post(`/dashboard/transactions/${id}/resend-webhook`, {}, { hideErrorToast: true });
      if (res.data.success) {
        toast.success(`Webhook resent! Status: ${res.data.webhookStatus}`);
        fetchTransactions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend webhook');
    }
  };

  const handleExport = () => {
    const exportData = data.map(tx => ({
      'Order ID': tx.transactionId,
      'Amount': tx.amount,
      'Currency': 'INR',
      'Status': tx.status,
      'Webhook Status': tx.webhookStatus,
      'Date': new Date(tx.createdAt).toLocaleString()
    }));
    exportToCsv('payout_history.csv', exportData);
  };

  return (
    <div className="pg-root">
      <div className="pg-toolbar">
        <form className="pg-filters" onSubmit={handleSearch}>
          <div className="pouth-search-wrap">
            <FiSearch className="pouth-search-icon" />
            <input type="text" className="pg-input pouth-search-input"
              placeholder="Search order ID..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="pg-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
          </select>
          <button type="submit" className="pg-btn pg-btn-secondary"><FiSearch /> Search</button>
          <button type="button" className="pg-btn pg-btn-secondary" onClick={fetchTransactions}><FiRefreshCw /></button>
        </form>
      </div>

      <div className="pg-card">
        <div className="pg-card-header">
          <h4 className="pg-card-title">
            <span className="pg-card-title-icon"><FiArrowUpRight /></span>
            Payout History
          </h4>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span className="pouth-count">{pagination?.totalRecords || data.length} records</span>
            <button className="pg-btn pg-btn-primary pg-btn-sm" onClick={handleExport} disabled={data.length === 0}>
              <FiDownload /> Export
            </button>
          </div>
        </div>
        <div className="pg-table-wrap">
          {loading ? (
            <div className="pg-loading"><FiRefreshCw /> Loading...</div>
          ) : (
            <table className="pg-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Amount</th>
                  <th>Tax/Fee</th>
                  <th>Account Details</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Webhook</th>
                  <th>Date & Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan="7"><div className="pg-empty"><p>No history found</p></div></td></tr>
                ) : data.map(tx => (
                  <tr key={tx._id}>
                    <td className="pouth-id">
                      <div>{tx.transactionId}</div>
                      {tx.gatewayOrderId && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '2px', fontFamily: 'monospace' }}>
                          UTR: {tx.gatewayOrderId}
                        </div>
                      )}
                    </td>
                    <td className="pouth-amount">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                    <td className="pouth-amount" style={{ color: '#ef4444' }}>₹{Number(tx.commissionAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="pouth-details">
                      {tx.customerDetails?.accountNumber ? (
                        <div style={{ fontSize: '0.85rem', lineHeight: '1.2' }}>
                          <div style={{ fontWeight: 600 }}>{tx.customerDetails.accountName || '-'}</div>
                          <div style={{ color: 'var(--text-secondary)' }}>{tx.customerDetails.accountNumber} / {tx.customerDetails.ifscCode}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td><span className="pg-badge pg-badge-inr">INR</span></td>
                    <td><span className={statusClass(tx.status)}>{tx.status === 'queued' ? 'pending' : tx.status}</span></td>
                    <td><span className={statusClass(tx.webhookStatus || 'pending')}>{tx.webhookStatus || 'pending'}</span></td>
                    <td className="pouth-date">{new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td>
                      <button className="pg-btn pg-btn-secondary pg-btn-sm" onClick={() => handleResendWebhook(tx._id)}>
                        <FiRotateCw /> Resend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
          />
        </div>
      </div>
    </div>
  );
};

export default PayoutHistory;
