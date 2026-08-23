import { useEffect, useState } from 'react';
import {
  FiAlertCircle,
  FiDollarSign,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
  FiUsers
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import Pagination from '../../../../components/ui/Pagination/Pagination';
import api from '../../../../services/apiClient';
import './SystemBalances.css';

const SystemBalances = () => {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch system health (upstream balance, total liabilities)
      const healthRes = await api.get('/v1/gateway/system/health');
      if (healthRes.data.success) {
        setHealthData(healthRes.data);
      }

      // Fetch users for the merchant balances table
      const usersRes = await api.get('/users', {
        params: { search, page, limit }
      });
      if (usersRes.data.status) {
        setUsers(usersRes.data.users);
        setPagination(usersRes.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to fetch system balances data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [page, limit]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  if (loading && !healthData) {
    return <div className="pg-loading"><FiRefreshCw className="spin" /> Loading System Balances...</div>;
  }

  const gatewayBalance = healthData?.upstream?.balance || 0;
  const totalLiabilities = healthData?.totalUserBalance || 0;
  const float = gatewayBalance - totalLiabilities;
  const isDeficit = float < 0;

  return (
    <div className="pg-dashboard-content">
      <div className="pg-header">
        <div>
          <h2 className="pg-title">System Balances</h2>
          <p className="pg-subtitle">Reconcile gateway funds with merchant liabilities</p>
        </div>
        <button className="pg-btn pg-btn-secondary" onClick={fetchData}>
          <FiRefreshCw /> Refresh Data
        </button>
      </div>

      <div className="sys-bal-cards">
        <div className="pg-card sys-bal-card">
          <div className="sys-bal-icon-wrap" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <FiDollarSign size={24} />
          </div>
          <div className="sys-bal-info">
            <h4>AeroPay Gateway Balance</h4>
            <div className="sys-bal-amount">₹{Number(gatewayBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <p className="sys-bal-desc">Real-time liquid funds in upstream</p>
          </div>
        </div>

        <div className="pg-card sys-bal-card">
          <div className="sys-bal-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <FiUsers size={24} />
          </div>
          <div className="sys-bal-info">
            <h4>Total Merchant Liabilities</h4>
            <div className="sys-bal-amount">₹{Number(totalLiabilities).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <p className="sys-bal-desc">Sum of all merchant wallets</p>
          </div>
        </div>

        <div className="pg-card sys-bal-card" style={{ borderLeft: `4px solid ${isDeficit ? '#ef4444' : '#8b5cf6'}` }}>
          <div className="sys-bal-icon-wrap" style={{ background: isDeficit ? 'rgba(239, 68, 68, 0.1)' : 'rgba(139, 92, 246, 0.1)', color: isDeficit ? '#ef4444' : '#8b5cf6' }}>
            {isDeficit ? <FiAlertCircle size={24} /> : <FiTrendingUp size={24} />}
          </div>
          <div className="sys-bal-info">
            <h4>System {isDeficit ? 'Deficit' : 'Float (Profit)'}</h4>
            <div className="sys-bal-amount" style={{ color: isDeficit ? '#ef4444' : '#8b5cf6' }}>
              {isDeficit ? '-' : '+'}₹{Math.abs(float).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="sys-bal-desc">Gateway Balance vs Liabilities</p>
          </div>
        </div>
      </div>

      <div className="pg-card mt-4">
        <div className="pg-card-header">
          <h4 className="pg-card-title">Merchant Wallet Balances</h4>
          <form className="sys-bal-search" onSubmit={handleSearch}>
            <input
              type="text"
              className="pg-input"
              placeholder="Search merchant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="pg-btn pg-btn-secondary"><FiSearch /></button>
          </form>
        </div>
        <div className="pg-table-wrap">
          <table className="pg-table">
            <thead>
              <tr>
                <th>Merchant Details</th>
                <th>Role</th>
                <th>Wallet Balance</th>
                <th>Frozen Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="5"><div className="pg-empty">No merchants found</div></td></tr>
              ) : (
                users.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{user.businessName || user.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                    </td>
                    <td><span className="pg-badge">{user.role}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      ₹{Number(user.walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ color: '#ef4444' }}>
                      ₹{Number(user.frozenDetails?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`pg-status ${user.isActive ? 'pg-status-completed' : 'pg-status-failed'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
          />
        )}
      </div>
    </div>
  );
};

export default SystemBalances;
