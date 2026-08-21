import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../services/apiClient';
import { toast } from 'react-toastify';
import './UserProfileDetails.css';

const UserProfileDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // We can fetch all users and find this one, or ideally we'd have a specific endpoint. 
        // We already have a specific endpoint for user transactions, and for users we can use the admin list endpoint and filter, or just make a new call.
        // Wait, the API `api.get('/dashboard/admin/users')` returns all users. Let's just fetch all and find it since it's an admin route.
        const usersRes = await api.get('/users');
        const foundUser = usersRes.data.users.find(u => u._id === id);
        
        if (!foundUser) {
          toast.error("User not found");
          return;
        }
        setUser(foundUser);

        // Fetch user's transactions
        const txRes = await api.get(`/users/${id}/transactions`);
        setTransactions(txRes.data.data || []);
      } catch (err) {
        toast.error('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchUserData();
    }
  }, [id]);

  if (loading) {
    return <div className="loading-spinner">Loading Profile...</div>;
  }

  if (!user) {
    return <div style={{ padding: '20px' }}>User not found.</div>;
  }

  return (
    <div className="payment-page" style={{ padding: '20px' }}>
      <button 
        onClick={() => navigate(-1)} 
        className="btn-secondary"
        style={{ marginBottom: '20px' }}
      >
        &larr; Back
      </button>

      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user.name}
          {user.isVip && (
            <span style={{ fontSize: '14px', background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #fde68a' }}>
              VIP 👑
            </span>
          )}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <h4 style={{ color: '#64748b', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Personal Info</h4>
            <p style={{ margin: '8px 0' }}><strong>Email:</strong> {user.email}</p>
            <p style={{ margin: '8px 0' }}><strong>Phone:</strong> {user.phoneNumber || 'N/A'}</p>
            <p style={{ margin: '8px 0' }}><strong>Business:</strong> {user.businessName || 'N/A'}</p>
            <p style={{ margin: '8px 0' }}><strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}</p>
          </div>
          <div>
            <h4 style={{ color: '#64748b', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Financials</h4>
            <p style={{ margin: '8px 0' }}><strong>Wallet Balance:</strong> ₹{user.walletBalance || 0}</p>
            <p style={{ margin: '8px 0' }}><strong>Payout Balance:</strong> ₹{user.payoutBalance || 0}</p>
            <p style={{ margin: '8px 0', color: user.frozenAmount > 0 ? '#ef4444' : 'inherit' }}>
              <strong>Frozen Amount:</strong> ₹{user.frozenAmount || 0}
            </p>
            <p style={{ margin: '8px 0', color: '#ef4444' }}>
              <strong>Frozen Reason:</strong> {user.frozenReason || 'N/A'}
            </p>
          </div>
          <div>
            <h4 style={{ color: '#64748b', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Services & Commission</h4>
            <p style={{ margin: '8px 0' }}><strong>Payin Enabled:</strong> {user.isPayinEnabled ? 'Yes' : 'No'}</p>
            <p style={{ margin: '8px 0' }}><strong>Payout Enabled:</strong> {user.isPayoutEnabled ? 'Yes' : 'No'}</p>
            <p style={{ margin: '8px 0' }}><strong>Payin Comm:</strong> {user.commission?.payin?.percent || 0}% + ₹{user.commission?.payin?.flat || 0}</p>
            <p style={{ margin: '8px 0' }}><strong>Payout Comm:</strong> {user.commission?.payout?.percent || 0}% + ₹{user.commission?.payout?.flat || 0}</p>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Recent Transactions</h3>
        
        {transactions.length === 0 ? (
          <p>No transactions found for this user.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Transaction ID</th>
                  <th>Status</th>
                  <th>Webhook</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx._id}>
                    <td><span className="currency-badge">{tx.type}</span></td>
                    <td>₹{tx.amount}</td>
                    <td>{tx.transactionId}</td>
                    <td>
                      <span className={`status-badge ${tx.status === 'completed' ? 'open' : 'close'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td>{tx.webhookStatus || 'pending'}</td>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileDetails;
