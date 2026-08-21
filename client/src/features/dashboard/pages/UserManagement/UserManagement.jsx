import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserManagement.css';
import api from '../../../../services/apiClient';
import { useAuth } from '../../../../context/AuthContext';
import { toast } from 'react-toastify';
import './UserManagement.css'; // Reusing premium light theme table styles

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGlobalCommModalOpen, setIsGlobalCommModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [txData, setTxData] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  
  // Create Form State
  const [createData, setCreateData] = useState({ name: '', email: '', password: '', role: 'user' });

  const [globalCommData, setGlobalCommData] = useState({
    commission: {
      payin: { percent: 5, flat: 0 },
      payout: { percent: 2, flat: 0 }
    }
  });
  
  // Form State
  const [formData, setFormData] = useState({ 
    role: '', 
    customRole: '',
    isActive: true,
    isPayinEnabled: true,
    isPayoutEnabled: true,
    frozenAmount: 0,
    frozenReason: '',
    isVip: false,
    name: '',
    email: '',
    businessName: '',
    website: '',
    phoneNumber: '',
    commission: {
      payin: { percent: 5, flat: 0 },
      payout: { percent: 2, flat: 0 }
    }
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data } = await api.get('/roles');
      setRoles(data.roles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openManageModal = (user) => {
    setSelectedUser(user);
    setFormData({ 
      role: user.role, 
      customRole: user.customRole?._id || '',
      isActive: user.isActive !== false,
      isPayinEnabled: user.isPayinEnabled !== false,
      isPayoutEnabled: user.isPayoutEnabled !== false,
      frozenAmount: user.frozenAmount || 0,
      frozenReason: user.frozenReason || '',
      isVip: user.isVip || false,
      name: user.name || '',
      email: user.email || '',
      businessName: user.businessName || '',
      website: user.website || '',
      phoneNumber: user.phoneNumber || '',
      commission: user.commission || {
        payin: { percent: (user.commissionRate || 0.05) * 100, flat: 0 },
        payout: { percent: (user.commissionRate || 0.05) * 100, flat: 0 }
      }
    });
    setIsModalOpen(true);
  };

  const closeManageModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const openTxModal = async (user) => {
    setSelectedUser(user);
    setIsTxModalOpen(true);
    setTxLoading(true);
    try {
      const { data } = await api.get(`/users/${user._id}/transactions`);
      setTxData(data.data || []);
    } catch (error) {
      console.error('Error fetching tx:', error);
      toast.error('Failed to load transactions');
    } finally {
      setTxLoading(false);
    }
  };

  const closeTxModal = () => {
    setIsTxModalOpen(false);
    setSelectedUser(null);
    setTxData([]);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', createData);
      toast.success('User created successfully');
      fetchUsers();
      setIsCreateModalOpen(false);
      setCreateData({ name: '', email: '', password: '', role: 'user' });
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleSavePermissions = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await api.put(`/users/${selectedUser._id}/permissions`, formData);
      toast.success('User updated successfully');
      fetchUsers();
      closeManageModal();
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted successfully');
      setUsers(users.filter(u => u._id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleUpdateGlobalComm = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/bulk-commission', globalCommData);
      if (res.data.status) {
        toast.success(res.data.message);
        setIsGlobalCommModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update global commission');
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading users...</div>;
  }

  const isSuperAdmin = currentUser?.role === 'superadmin';

  return (
    <div className="payment-page">
      <div className="payment-filters" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>Users</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={fetchUsers}>Refresh</button>
          {isSuperAdmin && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" onClick={() => setIsGlobalCommModalOpen(true)}>Set Global Commission</button>
              <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>+ Create User</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          placeholder="Search by name, email, phone, or business name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
        />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Balance</th>
              <th>Commission</th>
              <th>Joined</th>
              {isSuperAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users
              .filter(user => {
                const search = searchTerm.toLowerCase();
                return (
                  user.name?.toLowerCase().includes(search) ||
                  user.email?.toLowerCase().includes(search) ||
                  user.phoneNumber?.toLowerCase().includes(search) ||
                  user.businessName?.toLowerCase().includes(search)
                );
              })
              .map(user => (
<tr key={user._id}>
                <td style={{ fontWeight: 500 }}>
                  <span 
                    onClick={() => navigate(`/dashboard/users/${user._id}`)} 
                    style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {user.name}
                  </span>
                  {user.isVip && (
                    <span style={{ 
                      fontSize: '10px', background: '#fef3c7', color: '#d97706', 
                      padding: '2px 6px', borderRadius: '4px', fontWeight: 600,
                      border: '1px solid #fde68a', display: 'block', marginTop: '4px', width: 'fit-content'
                    }}>
                      VIP 👑
                    </span>
                  )}
                </td>
                <td style={{ color: '#64748b' }}>{user.email}</td>
                <td>
                  <span className={`status-badge status-${user.role === 'superadmin' ? 'completed' : user.role === 'admin' ? 'processing' : 'pending'}`}>
                    {user.role}
                  </span>
                  {user.customRole && (
                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      ({user.customRole.name})
                    </span>
                  )}
                </td>
                <td>
                  <span className={`status-badge status-${user.isActive !== false ? 'completed' : 'failed'}`}>
                    {user.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ fontWeight: 'bold', color: '#10b981' }}>
                  ₹{(user.walletBalance || 0).toFixed(2)}
                  {(user.frozenAmount > 0) && (
                    <span style={{ display: 'block', fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                      (₹{user.frozenAmount.toFixed(2)} Frozen)
                    </span>
                  )}
                </td>
                <td>
                  {user.commission ? (
                    <div style={{ fontSize: '0.85rem' }}>
                      IN: {user.commission.payin.percent}%+₹{user.commission.payin.flat} | OUT: {user.commission.payout.percent}%+₹{user.commission.payout.flat}
                    </div>
                  ) : (
                    `${((user.commissionRate || 0.05) * 100).toFixed(2)}%`
                  )}
                </td>
                <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                
                {isSuperAdmin && (
                  <td>
                    {user.role !== 'superadmin' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={(e) => { e.stopPropagation(); openManageModal(user); }}
                        >
                          Manage
                        </button>
                        <button 
                          style={{ 
                            padding: '4px 8px', fontSize: '12px', background: '#e0e7ff', 
                            color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: '4px', cursor: 'pointer'
                          }}
                          onClick={(e) => { e.stopPropagation(); openTxModal(user); }}
                        >
                          Txs
                        </button>
                        <button 
                          onClick={() => handleDelete(user._id)}
                          style={{ 
                            padding: '4px 8px', fontSize: '12px', background: '#fee2e2', 
                            color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer'
                          }}
                        >
                          Del
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} className="text-center" style={{ padding: '2rem' }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* USER TRANSACTIONS MODAL */}
      {isTxModalOpen && selectedUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '12px', width: '90%', maxWidth: '900px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Transactions for {selectedUser.name}</h2>
              <button onClick={closeTxModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ overflowY: 'auto', padding: '20px' }}>
              {txLoading ? (
                <div className="text-center">Loading transactions...</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Amount (₹)</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txData.length === 0 ? (
                      <tr><td colSpan="5" className="text-center">No transactions found</td></tr>
                    ) : (
                      txData.map(tx => (
                        <tr key={tx._id}>
                          <td>{tx.transactionId}</td>
                          <td>
                            <span style={{ 
                              padding: '2px 8px', borderRadius: '12px', fontSize: '12px',
                              background: tx.type === 'payment' ? '#dcfce7' : '#fee2e2',
                              color: tx.type === 'payment' ? '#166534' : '#991b1b'
                            }}>
                              {tx.type.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontWeight: 'bold' }}>{tx.amount}</td>
                          <td>
                            <span className={`status-badge status-${tx.status === 'completed' ? 'completed' : 'pending'}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '13px', color: '#64748b' }}>
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MANAGE USER MODAL */}
      {isModalOpen && selectedUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '500px',
            padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '1.5rem' }}>
              Manage {selectedUser.name}
            </h2>
            
            <form onSubmit={handleSavePermissions}>
              <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Base Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    disabled={selectedUser.role === 'superadmin'}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  >
                    {selectedUser.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
                    <option value="user">Merchant (User)</option>
                    <option value="admin">Admin</option>
                    {selectedUser.role !== 'superadmin' && <option value="superadmin">Super Admin</option>}
                  </select>
                </div>
                {formData.role === 'admin' && (
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Custom Role (Permissions)</label>
                    <select 
                      value={formData.customRole}
                      onChange={(e) => setFormData({...formData, customRole: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    >
                      <option value="">-- No Custom Role --</option>
                      {roles.map(r => (
                        <option key={r._id} value={r._id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Account Status</label>
                  <select 
                    value={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                    disabled={selectedUser.role === 'superadmin'}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Frozen Amount (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.frozenAmount}
                    onChange={(e) => setFormData({...formData, frozenAmount: Number(e.target.value)})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Frozen Reason <small>(Visible to User)</small></label>
                <input 
                  type="text" value={formData.frozenReason}
                  onChange={(e) => setFormData({...formData, frozenReason: e.target.value})}
                  placeholder="E.g. Suspicious activity review"
                  required={Number(formData.frozenAmount) > 0}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" id="isPayinEnabled"
                    checked={formData.isPayinEnabled}
                    onChange={(e) => setFormData({...formData, isPayinEnabled: e.target.checked})}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="isPayinEnabled" style={{ color: '#475569', fontWeight: 500, cursor: 'pointer' }}>Enable Payin Service</label>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" id="isPayoutEnabled"
                    checked={formData.isPayoutEnabled}
                    onChange={(e) => setFormData({...formData, isPayoutEnabled: e.target.checked})}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="isPayoutEnabled" style={{ color: '#475569', fontWeight: 500, cursor: 'pointer' }}>Enable Payout Service</label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" id="isVip"
                    checked={formData.isVip}
                    onChange={(e) => setFormData({...formData, isVip: e.target.checked})}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="isVip" style={{ color: '#d97706', fontWeight: 600, cursor: 'pointer' }}>Mark as VIP User 👑</label>
                </div>
              </div>

              <h4 style={{ margin: '20px 0 10px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Profile Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Name</label>
                  <input 
                    type="text" value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Email</label>
                  <input 
                    type="email" value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Business Name</label>
                  <input 
                    type="text" value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Phone Number</label>
                  <input 
                    type="text" value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Website URL</label>
                  <input 
                    type="text" value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <h4 style={{ margin: '20px 0 10px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Payin Commission</h4>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Percent (%)</label>
                  <input 
                    type="number" step="0.01"
                    value={formData.commission.payin.percent}
                    onChange={(e) => setFormData({...formData, commission: { ...formData.commission, payin: { ...formData.commission.payin, percent: parseFloat(e.target.value) } }})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Flat Fee (₹)</label>
                  <input 
                    type="number" step="0.01"
                    value={formData.commission.payin.flat}
                    onChange={(e) => setFormData({...formData, commission: { ...formData.commission, payin: { ...formData.commission.payin, flat: parseFloat(e.target.value) } }})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <h4 style={{ margin: '20px 0 10px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Payout Commission</h4>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Percent (%)</label>
                  <input 
                    type="number" step="0.01"
                    value={formData.commission.payout.percent}
                    onChange={(e) => setFormData({...formData, commission: { ...formData.commission, payout: { ...formData.commission.payout, percent: parseFloat(e.target.value) } }})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Flat Fee (₹)</label>
                  <input 
                    type="number" step="0.01"
                    value={formData.commission.payout.flat}
                    onChange={(e) => setFormData({...formData, commission: { ...formData.commission, payout: { ...formData.commission.payout, flat: parseFloat(e.target.value) } }})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={closeManageModal} style={{ padding: '10px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 16px' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '500px',
            padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '1.5rem' }}>Create New User</h2>
            
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Name</label>
                <input 
                  type="text" required value={createData.name}
                  onChange={(e) => setCreateData({...createData, name: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Email</label>
                <input 
                  type="email" required value={createData.email}
                  onChange={(e) => setCreateData({...createData, email: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Password</label>
                <input 
                  type="password" required minLength="6" value={createData.password}
                  onChange={(e) => setCreateData({...createData, password: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Role</label>
                <select 
                  value={createData.role}
                  onChange={(e) => setCreateData({...createData, role: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                >
                  <option value="user">Merchant (User)</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{ padding: '10px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 16px' }}>Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL COMMISSION MODAL */}
      {isGlobalCommModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '500px',
            padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.5rem' }}>Set Global Commission</h2>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.9rem' }}>This will instantly update the commission for ALL users.</p>
            
            <form onSubmit={handleUpdateGlobalComm}>
              
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Payin Commission</h4>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Percent (%)</label>
                  <input 
                    type="number" step="0.01" required
                    value={globalCommData.commission.payin.percent}
                    onChange={(e) => setGlobalCommData({...globalCommData, commission: { ...globalCommData.commission, payin: { ...globalCommData.commission.payin, percent: parseFloat(e.target.value) } }})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Flat Fee (₹)</label>
                  <input 
                    type="number" step="0.01" required
                    value={globalCommData.commission.payin.flat}
                    onChange={(e) => setGlobalCommData({...globalCommData, commission: { ...globalCommData.commission, payin: { ...globalCommData.commission.payin, flat: parseFloat(e.target.value) } }})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <h4 style={{ margin: '20px 0 10px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Payout Commission</h4>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Percent (%)</label>
                  <input 
                    type="number" step="0.01" required
                    value={globalCommData.commission.payout.percent}
                    onChange={(e) => setGlobalCommData({...globalCommData, commission: { ...globalCommData.commission, payout: { ...globalCommData.commission.payout, percent: parseFloat(e.target.value) } }})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Flat Fee (₹)</label>
                  <input 
                    type="number" step="0.01" required
                    value={globalCommData.commission.payout.flat}
                    onChange={(e) => setGlobalCommData({...globalCommData, commission: { ...globalCommData.commission, payout: { ...globalCommData.commission.payout, flat: parseFloat(e.target.value) } }})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsGlobalCommModalOpen(false)} style={{ padding: '10px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 16px' }}>Apply to All Users</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
