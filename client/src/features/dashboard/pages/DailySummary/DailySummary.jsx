import React, { useState, useEffect } from 'react';
import api from '../../../../services/apiClient';
import { toast } from 'react-toastify';
import './DailySummary.css';

const DailySummary = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

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
    </div>
  );
};

export default DailySummary;
