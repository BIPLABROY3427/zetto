import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserManagement.css';
import api from '../../../../services/apiClient';
import { useAuth } from '../../../../context/AuthContext';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog';
import useConfirm from '../../../../components/ui/ConfirmDialog/useConfirm';

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
  const { confirm, confirmProps } = useConfirm();
  
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

  const handleDelete = async (userId, userName) => {
    const ok = await confirm({
      title: 'Delete User?',
      message: `Are you sure you want to permanently delete "${userName || 'this user'}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
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

  const filteredUsers = users.filter(user => {
    const s = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(s) ||
      user.email?.toLowerCase().includes(s) ||
      user.phoneNumber?.toLowerCase().includes(s) ||
      user.businessName?.toLowerCase().includes(s)
    );
  });

  const roleClass = (r) => {
    if (r === 'superadmin') return 'pg-badge pg-badge-red';
    if (r === 'admin')      return 'pg-badge pg-badge-blue';
    return 'pg-badge pg-badge-gray';
  };

  return (
    <>
    <div className="pg-root">

      {/* Toolbar */}
      <div className="pg-toolbar">
        <div>
          <h3 className="um-heading">User Management</h3>
          <p className="um-sub">{users.length} total users registered</p>
        </div>
        <div className="pg-actions">
          <div className="um-search-wrap">
            <span className="um-search-icon">🔍</span>
            <input
              type="text"
              className="pg-input um-search"
              placeholder="Search name, email, phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="pg-btn pg-btn-secondary" onClick={fetchUsers}>↻ Refresh</button>
          {isSuperAdmin && (
            <>
              <button className="pg-btn pg-btn-secondary" onClick={() => setIsGlobalCommModalOpen(true)}>
                Global Commission
              </button>
              <button className="pg-btn pg-btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                + Create User
              </button>
            </>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="pg-card">
        <div className="pg-card-header">
          <h4 className="pg-card-title">
            <span className="pg-card-title-icon">👥</span>
            All Users
          </h4>
          <span className="um-count">{filteredUsers.length} users</span>
        </div>
        <div className="pg-table-wrap">
          {loading ? (
            <div className="pg-loading">↻ Loading users...</div>
          ) : (
            <table className="pg-table">
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
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={isSuperAdmin ? 8 : 7}>
                    <div className="pg-empty"><p>No users found</p></div>
                  </td></tr>
                ) : filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div
                        className="um-user-name"
                        onClick={() => navigate(`/dashboard/users/${user._id}`)}
                      >
                        {user.name}
                        {user.isVip && <span className="um-vip">VIP 👑</span>}
                      </div>
                      {user.businessName && <div className="um-business">{user.businessName}</div>}
                    </td>
                    <td className="um-email">{user.email}</td>
                    <td>
                      <span className={roleClass(user.role)}>{user.role}</span>
                      {user.customRole && (
                        <div className="um-custom-role">{user.customRole.name}</div>
                      )}
                    </td>
                    <td>
                      <span className={`pg-status ${user.isActive !== false ? 'pg-status-completed' : 'pg-status-failed'}`}>
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="um-balance">₹{(user.walletBalance || 0).toFixed(2)}</div>
                      {user.frozenAmount > 0 && (
                        <div className="um-frozen">₹{user.frozenAmount.toFixed(2)} frozen</div>
                      )}
                    </td>
                    <td className="um-comm">
                      {user.commission
                        ? `IN: ${user.commission.payin.percent}%+₹${user.commission.payin.flat} | OUT: ${user.commission.payout.percent}%+₹${user.commission.payout.flat}`
                        : `${((user.commissionRate || 0.05) * 100).toFixed(2)}%`}
                    </td>
                    <td className="um-date">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                    {isSuperAdmin && (
                      <td>
                        {user.role !== 'superadmin' ? (
                          <div className="um-actions">
                            <button
                              className="pg-btn pg-btn-secondary pg-btn-sm"
                              onClick={e => { e.stopPropagation(); openManageModal(user); }}
                            >Manage</button>
                            <button
                              className="pg-btn pg-btn-secondary pg-btn-sm"
                              onClick={e => { e.stopPropagation(); openTxModal(user); }}
                            >Txns</button>
                            <button
                              className="pg-btn pg-btn-danger pg-btn-sm"
                              onClick={() => handleDelete(user._id, user.name)}
                            >Del</button>
                          </div>
                        ) : (
                          <span className="um-superadmin-lock">🔒 Protected</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── TRANSACTIONS MODAL ── */}
      {isTxModalOpen && selectedUser && (
        <div className="pg-modal-backdrop" onClick={e => e.target === e.currentTarget && closeTxModal()}>
          <div className="pg-modal pg-modal-lg">
            <div className="pg-modal-header">
              <h3 className="pg-modal-title">📋 Transactions — {selectedUser.name}</h3>
              <button className="pg-modal-close" onClick={closeTxModal}>✕</button>
            </div>
            <div className="pg-modal-body">
              {txLoading ? (
                <div className="pg-loading">Loading transactions...</div>
              ) : (
                <div className="pg-table-wrap">
                  <table className="pg-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txData.length === 0 ? (
                        <tr><td colSpan="5"><div className="pg-empty"><p>No transactions found</p></div></td></tr>
                      ) : txData.map(tx => (
                        <tr key={tx._id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary)' }}>{tx.transactionId}</td>
                          <td>
                            <span className={`pg-badge ${tx.type === 'payment' ? 'pg-badge-green' : 'pg-badge-amber'}`}>
                              {tx.type === 'payment' ? 'PayIn' : 'PayOut'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700 }}>₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`pg-status ${tx.status === 'completed' ? 'pg-status-completed' : tx.status === 'pending' ? 'pg-status-pending' : 'pg-status-failed'}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            {new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="pg-modal-footer">
              <button className="pg-btn pg-btn-secondary" onClick={closeTxModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MANAGE USER MODAL ── */}
      {isModalOpen && selectedUser && (
        <div className="pg-modal-backdrop" onClick={e => e.target === e.currentTarget && closeManageModal()}>
          <div className="pg-modal um-manage-modal">
            <div className="pg-modal-header">
              <h3 className="pg-modal-title">⚙️ Manage — {selectedUser.name}</h3>
              <button className="pg-modal-close" onClick={closeManageModal}>✕</button>
            </div>
            <form onSubmit={handleSavePermissions}>
              <div className="pg-modal-body pg-form">

                {/* Role + Custom Role */}
                <div className="pg-form-row-2">
                  <div className="pg-form-row">
                    <label className="pg-label">Base Role</label>
                    <select
                      className="pg-select"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                      disabled={selectedUser.role === 'superadmin'}
                    >
                      {selectedUser.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
                      <option value="user">Merchant (User)</option>
                      <option value="admin">Admin</option>
                      {selectedUser.role !== 'superadmin' && <option value="superadmin">Super Admin</option>}
                    </select>
                  </div>
                  {formData.role === 'admin' && (
                    <div className="pg-form-row">
                      <label className="pg-label">Custom Role (Permissions)</label>
                      <select className="pg-select" value={formData.customRole} onChange={e => setFormData({...formData, customRole: e.target.value})}>
                        <option value="">-- No Custom Role --</option>
                        {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {/* Account Status + Frozen */}
                <div className="pg-form-row-2">
                  <div className="pg-form-row">
                    <label className="pg-label">Account Status</label>
                    <select className="pg-select" value={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})} disabled={selectedUser.role === 'superadmin'}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div className="pg-form-row">
                    <label className="pg-label">Frozen Amount (₹)</label>
                    <input type="number" min="0" className="pg-field"
                      value={formData.frozenAmount}
                      onChange={e => setFormData({...formData, frozenAmount: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="pg-form-row">
                  <label className="pg-label">Frozen Reason <small>(Visible to user)</small></label>
                  <input type="text" className="pg-field"
                    placeholder="e.g. Suspicious activity review"
                    value={formData.frozenReason}
                    required={Number(formData.frozenAmount) > 0}
                    onChange={e => setFormData({...formData, frozenReason: e.target.value})} />
                </div>

                {/* Toggles */}
                <div className="um-toggle-row">
                  <label className="um-toggle">
                    <input type="checkbox" id="isPayinEnabled" checked={formData.isPayinEnabled}
                      onChange={e => setFormData({...formData, isPayinEnabled: e.target.checked})} />
                    <span>Enable Payin</span>
                  </label>
                  <label className="um-toggle">
                    <input type="checkbox" id="isPayoutEnabled" checked={formData.isPayoutEnabled}
                      onChange={e => setFormData({...formData, isPayoutEnabled: e.target.checked})} />
                    <span>Enable Payout</span>
                  </label>
                  <label className="um-toggle um-vip-toggle">
                    <input type="checkbox" id="isVip" checked={formData.isVip}
                      onChange={e => setFormData({...formData, isVip: e.target.checked})} />
                    <span>VIP User 👑</span>
                  </label>
                </div>

                {/* Profile Details */}
                <div className="um-section-title">Profile Details</div>
                <div className="pg-form-row-2">
                  <div className="pg-form-row">
                    <label className="pg-label">Name</label>
                    <input type="text" className="pg-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="pg-form-row">
                    <label className="pg-label">Email</label>
                    <input type="email" className="pg-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="pg-form-row">
                    <label className="pg-label">Business Name</label>
                    <input type="text" className="pg-field" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
                  </div>
                  <div className="pg-form-row">
                    <label className="pg-label">Phone Number</label>
                    <input type="text" className="pg-field" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
                  </div>
                  <div className="pg-form-row" style={{ gridColumn: 'span 2' }}>
                    <label className="pg-label">Website URL</label>
                    <input type="text" className="pg-field" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                  </div>
                </div>

                {/* Commission */}
                <div className="um-section-title">Payin Commission</div>
                <div className="pg-form-row-2">
                  <div className="pg-form-row">
                    <label className="pg-label">Percent (%)</label>
                    <input type="number" step="0.01" className="pg-field" value={formData.commission.payin.percent}
                      onChange={e => setFormData({...formData, commission: {...formData.commission, payin: {...formData.commission.payin, percent: parseFloat(e.target.value)}}})} />
                  </div>
                  <div className="pg-form-row">
                    <label className="pg-label">Flat Fee (₹)</label>
                    <input type="number" step="0.01" className="pg-field" value={formData.commission.payin.flat}
                      onChange={e => setFormData({...formData, commission: {...formData.commission, payin: {...formData.commission.payin, flat: parseFloat(e.target.value)}}})} />
                  </div>
                </div>

                <div className="um-section-title">Payout Commission</div>
                <div className="pg-form-row-2">
                  <div className="pg-form-row">
                    <label className="pg-label">Percent (%)</label>
                    <input type="number" step="0.01" className="pg-field" value={formData.commission.payout.percent}
                      onChange={e => setFormData({...formData, commission: {...formData.commission, payout: {...formData.commission.payout, percent: parseFloat(e.target.value)}}})} />
                  </div>
                  <div className="pg-form-row">
                    <label className="pg-label">Flat Fee (₹)</label>
                    <input type="number" step="0.01" className="pg-field" value={formData.commission.payout.flat}
                      onChange={e => setFormData({...formData, commission: {...formData.commission, payout: {...formData.commission.payout, flat: parseFloat(e.target.value)}}})} />
                  </div>
                </div>

              </div>
              <div className="pg-modal-footer">
                <button type="button" className="pg-btn pg-btn-secondary" onClick={closeManageModal}>Cancel</button>
                <button type="submit" className="pg-btn pg-btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE USER MODAL ── */}
      {isCreateModalOpen && (
        <div className="pg-modal-backdrop" onClick={e => e.target === e.currentTarget && setIsCreateModalOpen(false)}>
          <div className="pg-modal pg-modal-sm">
            <div className="pg-modal-header">
              <h3 className="pg-modal-title">👤 Create New User</h3>
              <button className="pg-modal-close" onClick={() => setIsCreateModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="pg-modal-body pg-form">
                <div className="pg-form-row">
                  <label className="pg-label"><span className="pg-label-req">*</span> Full Name</label>
                  <input type="text" required className="pg-field" value={createData.name}
                    onChange={e => setCreateData({...createData, name: e.target.value})} />
                </div>
                <div className="pg-form-row">
                  <label className="pg-label"><span className="pg-label-req">*</span> Email</label>
                  <input type="email" required className="pg-field" value={createData.email}
                    onChange={e => setCreateData({...createData, email: e.target.value})} />
                </div>
                <div className="pg-form-row">
                  <label className="pg-label"><span className="pg-label-req">*</span> Password</label>
                  <input type="password" required minLength="6" className="pg-field" value={createData.password}
                    onChange={e => setCreateData({...createData, password: e.target.value})} />
                </div>
                <div className="pg-form-row">
                  <label className="pg-label">Role</label>
                  <select className="pg-select" value={createData.role} onChange={e => setCreateData({...createData, role: e.target.value})}>
                    <option value="user">Merchant (User)</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
              </div>
              <div className="pg-modal-footer">
                <button type="button" className="pg-btn pg-btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="pg-btn pg-btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── GLOBAL COMMISSION MODAL ── */}
      {isGlobalCommModalOpen && (
        <div className="pg-modal-backdrop" onClick={e => e.target === e.currentTarget && setIsGlobalCommModalOpen(false)}>
          <div className="pg-modal">
            <div className="pg-modal-header">
              <h3 className="pg-modal-title">📊 Set Global Commission</h3>
              <button className="pg-modal-close" onClick={() => setIsGlobalCommModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateGlobalComm}>
              <div className="pg-modal-body pg-form">
                <p className="um-global-warn">⚠️ This will instantly update commission for <strong>ALL users</strong>.</p>

                <div className="um-section-title">Payin Commission</div>
                <div className="pg-form-row-2">
                  <div className="pg-form-row">
                    <label className="pg-label">Percent (%)</label>
                    <input type="number" step="0.01" required className="pg-field" value={globalCommData.commission.payin.percent}
                      onChange={e => setGlobalCommData({...globalCommData, commission: {...globalCommData.commission, payin: {...globalCommData.commission.payin, percent: parseFloat(e.target.value)}}})} />
                  </div>
                  <div className="pg-form-row">
                    <label className="pg-label">Flat Fee (₹)</label>
                    <input type="number" step="0.01" required className="pg-field" value={globalCommData.commission.payin.flat}
                      onChange={e => setGlobalCommData({...globalCommData, commission: {...globalCommData.commission, payin: {...globalCommData.commission.payin, flat: parseFloat(e.target.value)}}})} />
                  </div>
                </div>

                <div className="um-section-title">Payout Commission</div>
                <div className="pg-form-row-2">
                  <div className="pg-form-row">
                    <label className="pg-label">Percent (%)</label>
                    <input type="number" step="0.01" required className="pg-field" value={globalCommData.commission.payout.percent}
                      onChange={e => setGlobalCommData({...globalCommData, commission: {...globalCommData.commission, payout: {...globalCommData.commission.payout, percent: parseFloat(e.target.value)}}})} />
                  </div>
                  <div className="pg-form-row">
                    <label className="pg-label">Flat Fee (₹)</label>
                    <input type="number" step="0.01" required className="pg-field" value={globalCommData.commission.payout.flat}
                      onChange={e => setGlobalCommData({...globalCommData, commission: {...globalCommData.commission, payout: {...globalCommData.commission.payout, flat: parseFloat(e.target.value)}}})} />
                  </div>
                </div>
              </div>
              <div className="pg-modal-footer">
                <button type="button" className="pg-btn pg-btn-secondary" onClick={() => setIsGlobalCommModalOpen(false)}>Cancel</button>
                <button type="submit" className="pg-btn pg-btn-primary">Apply to All Users</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>

    <ConfirmDialog {...confirmProps} />
    </>
  );
};

export default UserManagement;

