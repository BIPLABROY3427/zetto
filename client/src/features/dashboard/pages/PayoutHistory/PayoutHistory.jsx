import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../../services/apiClient';
import './PayoutHistory.css';

const PayoutHistory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('completed');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/transactions', {
        params: { type: 'withdrawal', search, status }
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
                <th>Order No</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Order State</th>
                <th>Webhook</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan="8" className="text-center">No Data</td></tr>
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
                    <td>
                      <span className={`status-badge ${tx.webhookStatus === 'sent' ? 'open' : (tx.webhookStatus === 'failed' ? 'close' : 'pending')}`}>
                        {tx.webhookStatus || 'pending'}
                      </span>
                    </td>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn-primary"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => handleResendWebhook(tx._id)}
                      >
                        Resend Webhook
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PayoutHistory;
