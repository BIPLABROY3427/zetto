import { useEffect, useState } from 'react';
import { FiCalendar, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../../../services/apiClient';
import './DailySummary.css';

const statusClass = (s) => {
  if (s === 'completed' || s === 'success' || s === 'sent') return 'pg-status pg-status-completed';
  if (s === 'pending' || s === 'queued' || s === 'pending_retry') return 'pg-status pg-status-pending';
  return 'pg-status pg-status-failed';
};

const DailySummary = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/transactions', { params: { type: 'payment', search, status } });
      setData(res.data.data || []);
    } catch {
      toast.error('Failed to fetch Daily Summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [status]);
  const handleSearch = (e) => { e.preventDefault(); fetchTransactions(); };

  const totalAmount = data.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const completed = data.filter(tx => tx.status === 'completed').length;

  return (
    <div className="pg-root">
      {/* Stats Row */}
      <div className="pg-stats-row">
        <div className="pg-stat-card">
          <div className="pg-stat-label">Total Transactions</div>
          <div className="pg-stat-val">{data.length}</div>
        </div>
        <div className="pg-stat-card">
          <div className="pg-stat-label">Total Volume</div>
          <div className="pg-stat-val blue">₹{totalAmount.toLocaleString('en-IN')}</div>
        </div>
        <div className="pg-stat-card">
          <div className="pg-stat-label">Completed</div>
          <div className="pg-stat-val green">{completed}</div>
        </div>
        <div className="pg-stat-card">
          <div className="pg-stat-label">Pending / Failed</div>
          <div className="pg-stat-val red">{data.length - completed}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="pg-toolbar">
        <form className="pg-filters" onSubmit={handleSearch}>
          <div className="ds-search-wrap">
            <FiSearch className="ds-search-icon" />
            <input type="text" className="pg-input ds-search-input"
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
            <span className="pg-card-title-icon"><FiCalendar /></span>
            Daily Summary
          </h4>
          <span className="ds-count">{data.length} records</span>
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
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan="5"><div className="pg-empty"><p>No data found</p></div></td></tr>
                ) : data.map(tx => (
                  <tr key={tx._id}>
                    <td className="ds-id">{tx.transactionId}</td>
                    <td className="ds-amount">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                    <td><span className="pg-badge pg-badge-inr">INR</span></td>
                    <td><span className={statusClass(tx.status)}>{tx.status === 'queued' ? 'pending' : tx.status}</span></td>
                    <td className="ds-date">{new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
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

export default DailySummary;
