import React, { useState, useEffect } from 'react';
import api from '../../../../services/apiClient';
import { toast } from 'react-toastify';
import { FiSearch, FiRefreshCw, FiBarChart2 } from 'react-icons/fi';
import './BalDaySum.css';

const statusClass = (s) => {
  if (s === 'completed' || s === 'success') return 'pg-status pg-status-completed';
  if (s === 'pending') return 'pg-status pg-status-pending';
  return 'pg-status pg-status-failed';
};

const BalDaySum = () => {
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
      toast.error('Failed to fetch Balance Summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [status]);
  const handleSearch = (e) => { e.preventDefault(); fetchTransactions(); };

  const totalIn  = data.filter(tx => tx.status === 'completed').reduce((s, tx) => s + (tx.amount || 0), 0);
  const totalAll = data.reduce((s, tx) => s + (tx.amount || 0), 0);

  return (
    <div className="pg-root">
      <div className="pg-stats-row">
        <div className="pg-stat-card">
          <div className="pg-stat-label">Total Records</div>
          <div className="pg-stat-val">{data.length}</div>
        </div>
        <div className="pg-stat-card">
          <div className="pg-stat-label">Total Volume</div>
          <div className="pg-stat-val blue">₹{totalAll.toLocaleString('en-IN')}</div>
        </div>
        <div className="pg-stat-card">
          <div className="pg-stat-label">Settled Amount</div>
          <div className="pg-stat-val green">₹{totalIn.toLocaleString('en-IN')}</div>
        </div>
        <div className="pg-stat-card">
          <div className="pg-stat-label">Unsettled</div>
          <div className="pg-stat-val amber">₹{(totalAll - totalIn).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="pg-toolbar">
        <form className="pg-filters" onSubmit={handleSearch}>
          <div className="bds-search-wrap">
            <FiSearch className="bds-search-icon" />
            <input type="text" className="pg-input bds-search-input"
              placeholder="Search order ID..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="pg-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <button type="submit" className="pg-btn pg-btn-secondary"><FiSearch /> Search</button>
          <button type="button" className="pg-btn pg-btn-secondary" onClick={fetchTransactions}><FiRefreshCw /></button>
        </form>
      </div>

      <div className="pg-card">
        <div className="pg-card-header">
          <h4 className="pg-card-title">
            <span className="pg-card-title-icon"><FiBarChart2 /></span>
            Balance Daily Summary
          </h4>
          <span className="bds-count">{data.length} records</span>
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
                  <tr><td colSpan="5"><div className="pg-empty"><p>No balance summary data found</p></div></td></tr>
                ) : data.map(tx => (
                  <tr key={tx._id}>
                    <td className="bds-id">{tx.transactionId}</td>
                    <td className="bds-amount">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                    <td><span className="pg-badge pg-badge-inr">INR</span></td>
                    <td><span className={statusClass(tx.status)}>{tx.status}</span></td>
                    <td className="bds-date">{new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
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

export default BalDaySum;
