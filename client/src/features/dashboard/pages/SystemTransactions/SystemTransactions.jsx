import { useEffect, useState } from 'react';
import { FiDatabase, FiEye, FiRefreshCw, FiRotateCw, FiSearch, FiX } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Pagination from '../../../../components/ui/Pagination/Pagination';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog';
import useConfirm from '../../../../components/ui/ConfirmDialog/useConfirm';
import api from '../../../../services/apiClient';
import './SystemTransactions.css';

const statusClass = (s) => {
  if (s === 'completed' || s === 'success' || s === 'sent') return 'pg-status pg-status-completed';
  if (s === 'pending' || s === 'queued' || s === 'pending_retry') return 'pg-status pg-status-pending';
  return 'pg-status pg-status-failed';
};

const SystemTransactions = ({ initialType = 'all' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlMerchantId = queryParams.get('merchantId') || '';

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState(initialType);
  const [selectedTx, setSelectedTx] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState(null);
  const [merchantId, setMerchantId] = useState(urlMerchantId);
  const [merchantInfo, setMerchantInfo] = useState(null);
  const { confirm, confirmProps } = useConfirm();

  useEffect(() => { setType(initialType); }, [initialType]);

  // Keep merchantId state in sync with URL
  useEffect(() => {
    setMerchantId(urlMerchantId);
  }, [urlMerchantId]);

  // Fetch merchant name if merchantId is set
  useEffect(() => {
    if (!merchantId) {
      setMerchantInfo(null);
      return;
    }
    let isMounted = true;
    api.get(`/users/${merchantId}`)
      .then(res => {
        if (isMounted && res.data?.user) {
          setMerchantInfo(res.data.user);
        }
      })
      .catch(() => {
        // If user info cannot be loaded, merchantId is still kept
      });
    return () => { isMounted = false; };
  }, [merchantId]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = { type, search: search.trim(), status, page, limit };
      if (merchantId && merchantId.trim() !== '' && merchantId !== 'all') {
        params.merchantId = merchantId.trim();
      }
      const res = await api.get('/dashboard/admin/transactions', { params });

      setData(res.data.data || []);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to fetch transactions'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTransactions();
  }, [status, type, page, limit, merchantId]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchTransactions(); };

  const handleClearMerchantFilter = () => {
    setMerchantId('');
    setMerchantInfo(null);
    setPage(1);
    navigate(location.pathname);
  };

  const handleResendWebhook = async (id) => {
    try {
      const res = await api.post(`/dashboard/transactions/${id}/resend-webhook`, {}, { hideErrorToast: true });
      if (res.data.success) { toast.success(`Webhook resent!`); fetchTransactions(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to resend webhook'); }
  };

  const handleSyncTransaction = async (id) => {
    try {
      toast.info('Syncing status with AeroPay...');
      const res = await api.post(`/dashboard/admin/transactions/${id}/sync`);
      if (res.data.success) {
        toast.success(res.data.message || 'Transaction synced');
        fetchTransactions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync transaction');
    }
  };

  const handleCancelPayoutQueue = async (tx) => {
    const ok = await confirm({
      title: 'Cancel Payout?',
      message: `Are you sure you want to cancel payout for ${tx.transactionId}? The amount will be refunded and a failure webhook will be sent.`,
      confirmText: 'Yes, Cancel',
      cancelText: 'No',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      const res = await api.post(`/dashboard/admin/transactions/${tx._id}/cancel-payout`);
      if (res.data.success) {
        toast.success(res.data.message || 'Payout cancelled');
        fetchTransactions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel payout');
    }
  };

  return (
    <div className="pg-root">
      <ConfirmDialog {...confirmProps} />
      <div className="pg-toolbar">
        <form className="pg-filters" onSubmit={handleSearch}>
          <div className="st-search-wrap">
            <FiSearch className="st-search-icon" />
            <input type="text" className="pg-input st-search-input"
              placeholder="Search Order ID, Merchant ID, Name, UTR..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="pg-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="queued">Queued</option>
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

      {merchantId && (
        <div className="st-active-filter">
          <span>
            Filtering by Merchant: <strong>{merchantInfo?.name || merchantInfo?.businessName || merchantId}</strong>
            {merchantInfo && (
              <span style={{ opacity: 0.8, marginLeft: '6px' }}>
                ({merchantInfo.email} · <code>{merchantId}</code>)
              </span>
            )}
          </span>
          <button
            type="button"
            className="st-clear-filter-btn"
            onClick={handleClearMerchantFilter}
            title="Clear Merchant Filter"
          >
            <FiX /> Clear Filter
          </button>
        </div>
      )}

      <div className="pg-card">
        <div className="pg-card-header">
          <h4 className="pg-card-title">
            <span className="pg-card-title-icon"><FiDatabase /></span>
            System Transactions
          </h4>
          <span className="tk-count">{pagination?.totalRecords || data.length} records</span>
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
                  <th>Tax/Fee</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Webhook</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan="10"><div className="pg-empty"><p>No transactions found</p></div></td></tr>
                ) : data.map(tx => (
                  <tr key={tx._id}>
                    <td>
                      <div className="st-merchant" onClick={() => navigate(`/dashboard/users/${tx.merchantId?._id}`)}>
                        <span className="st-merchant-name">{tx.merchantId?.name || 'Unknown'}</span>
                        <span className="st-merchant-email">{tx.merchantId?.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`pg-badge ${tx.type === 'payment' ? 'pg-badge-blue' : tx.type === 'withdrawal' ? 'pg-badge-amber' : tx.type === 'freeze' ? 'pg-badge-red' : 'pg-badge-green'}`}>
                        {tx.type === 'payment' ? 'PayIn' : tx.type === 'withdrawal' ? 'PayOut' : tx.type === 'freeze' ? 'Freeze' : tx.type === 'unfreeze' ? 'Unfreeze' : tx.type}
                      </span>
                    </td>
                    <td className="st-order-id">
                      <div>{tx.transactionId}</div>
                      {tx.gatewayOrderId && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '2px', fontFamily: 'monospace' }}>
                          UTR: {tx.gatewayOrderId}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                    <td style={{ color: '#ef4444' }}>₹{Number(tx.commissionAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="st-details">
                      {tx.type === 'payment' ? (
                        tx.paymentUrl ? <a href={tx.paymentUrl} target="_blank" rel="noreferrer" className="st-link">Link ↗</a> : '-'
                      ) : (
                        tx.customerDetails?.accountNumber
                          ? <span>{tx.customerDetails.accountName ? `${tx.customerDetails.accountName} - ` : ''}{tx.customerDetails.accountNumber} / {tx.customerDetails.ifscCode}</span>
                          : '-'
                      )}
                    </td>
                    <td><span className={statusClass(tx.status)}>{tx.status === 'queued' ? 'pending' : tx.status}</span></td>
                    <td><span className={statusClass(tx.webhookStatus || 'pending')}>{tx.webhookStatus || 'pending'}</span></td>
                    <td className="st-date">{new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td>
                        <div className="st-actions">
                        {tx.type === 'withdrawal' && (tx.status === 'pending' || tx.status === 'queued') && (
                          <button className="pg-btn pg-btn-secondary pg-btn-sm" style={{color: '#ef4444', borderColor: '#ef444433'}} onClick={() => handleCancelPayoutQueue(tx)} title="Cancel Payout"><FiX /></button>
                        )}
                        {tx.status === 'pending' && (
                          <button className="pg-btn pg-btn-secondary pg-btn-sm" onClick={() => handleSyncTransaction(tx._id)} title="Sync Status"><FiRefreshCw /></button>
                        )}
                        <button className="pg-btn pg-btn-secondary pg-btn-sm" onClick={() => setSelectedTx(tx)} title="View Details"><FiEye /></button>
                        <button className="pg-btn pg-btn-secondary pg-btn-sm" onClick={() => handleResendWebhook(tx._id)} title="Resend Webhook"><FiRotateCw /></button>
                      </div>
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
