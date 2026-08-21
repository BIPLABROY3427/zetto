import React, { useState, useEffect } from 'react';
import './RolesAndPermissions.css';
import api from '../../../../services/apiClient';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiShield, FiX, FiRefreshCw } from 'react-icons/fi';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog';
import useConfirm from '../../../../components/ui/ConfirmDialog/useConfirm';

const MODULES = [
  'Dashboard Overview',
  'Payin Management',
  'Payout Management',
  'Transaction History',
  'Support Tickets',
  'API Documentation',
  'User Management',
  'Developer Settings'
];

const ACTIONS = ['view', 'create', 'edit', 'delete'];

const RolesAndPermissions = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { confirm, confirmProps } = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  const [formData, setFormData] = useState({ name: '', description: '', permissions: {} });

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/roles');
      setRoles(data.roles || []);
    } catch {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEdit(false);
    setSelectedRoleId(null);
    setFormData({ name: '', description: '', permissions: {} });
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    setIsEdit(true);
    setSelectedRoleId(role._id);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || {}
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleCheckboxChange = (module, action) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: !prev.permissions[module]?.[action]
        }
      }
    }));
  };

  const handleSelectAll = (module) => {
    const allChecked = ACTIONS.every(a => formData.permissions[module]?.[a]);
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: allChecked
          ? {}
          : Object.fromEntries(ACTIONS.map(a => [a, true]))
      }
    }));
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put(`/roles/${selectedRoleId}`, formData);
        toast.success('Role updated successfully!');
      } else {
        await api.post('/roles', formData);
        toast.success('Role created successfully!');
      }
      fetchRoles();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save role');
    }
  };

  const handleDeleteRole = async (roleId, roleName) => {
    const ok = await confirm({
      title: 'Delete Role?',
      message: `Delete "${roleName}"? This may affect users assigned to this role.`,
      confirmText: 'Delete Role',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/roles/${roleId}`);
      toast.success('Role deleted!');
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    }
  };

  // Count how many permissions are active for a role
  const permCount = (role) => {
    if (!role.permissions) return 0;
    return Object.values(role.permissions).reduce((sum, mod) =>
      sum + Object.values(mod).filter(Boolean).length, 0
    );
  };

  return (
    <>
    <div className="pg-root">

      {/* Toolbar */}
      <div className="pg-toolbar">
        <div>
          <h3 className="rp-heading">Roles & Permissions</h3>
          <p className="rp-sub">Define access levels for each staff role</p>
        </div>
        <div className="pg-actions">
          <button className="pg-btn pg-btn-secondary" onClick={fetchRoles}>
            <FiRefreshCw />
          </button>
          <button className="pg-btn pg-btn-primary" onClick={openCreateModal}>
            <FiPlus /> Create Role
          </button>
        </div>
      </div>

      {/* Roles Table Card */}
      <div className="pg-card">
        <div className="pg-card-header">
          <h4 className="pg-card-title">
            <span className="pg-card-title-icon"><FiShield /></span>
            Custom Roles
          </h4>
          <span className="rp-count">{roles.length} roles</span>
        </div>
        <div className="pg-table-wrap">
          {loading ? (
            <div className="pg-loading"><FiRefreshCw /> Loading roles...</div>
          ) : (
            <table className="pg-table">
              <thead>
                <tr>
                  <th>Role Name</th>
                  <th>Description</th>
                  <th>Permissions</th>
                  <th>Members</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.length === 0 ? (
                  <tr><td colSpan="5">
                    <div className="pg-empty"><p>No custom roles found. Create one to get started.</p></div>
                  </td></tr>
                ) : roles.map(role => (
                  <tr key={role._id}>
                    <td>
                      <div className="rp-role-name">
                        <span className="rp-role-icon"><FiShield /></span>
                        {role.name}
                        {role.isSystem && <span className="rp-system-badge">System</span>}
                      </div>
                    </td>
                    <td className="rp-desc">{role.description || '—'}</td>
                    <td>
                      <span className="pg-badge pg-badge-blue">{permCount(role)} permissions</span>
                    </td>
                    <td>
                      <span className="pg-badge pg-badge-gray">{role.members || 0} members</span>
                    </td>
                    <td>
                      <div className="rp-actions">
                        {!role.isSystem ? (
                          <>
                            <button
                              className="pg-btn pg-btn-secondary pg-btn-sm"
                              onClick={() => openEditModal(role)}
                              title="Edit Role"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              className="pg-btn pg-btn-danger pg-btn-sm"
                              onClick={() => handleDeleteRole(role._id, role.name)}
                              title="Delete Role"
                            >
                              <FiTrash2 />
                            </button>
                          </>
                        ) : (
                          <span className="rp-protected">🔒 Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create / Edit Role Modal */}
      {isModalOpen && (
        <div className="pg-modal-backdrop" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="pg-modal rp-modal">
            <div className="pg-modal-header">
              <h3 className="pg-modal-title">
                <FiShield style={{ marginRight: 8, color: 'var(--primary)' }} />
                {isEdit ? 'Edit Role' : 'Create New Role'}
              </h3>
              <button className="pg-modal-close" onClick={closeModal}><FiX /></button>
            </div>

            <form onSubmit={handleSaveRole}>
              <div className="pg-modal-body pg-form">

                {/* Role Details */}
                <div className="rp-section-title">Role Details</div>
                <div className="pg-form-row-2">
                  <div className="pg-form-row">
                    <label className="pg-label"><span className="pg-label-req">*</span> Role Name</label>
                    <input
                      type="text" required className="pg-field"
                      placeholder="e.g. Support Manager"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="pg-form-row">
                    <label className="pg-label">Description</label>
                    <input
                      type="text" className="pg-field"
                      placeholder="Brief description of responsibilities"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>

                {/* Permissions Matrix */}
                <div className="rp-section-title" style={{ marginTop: '0.5rem' }}>Module Permissions</div>
                <p className="rp-perm-hint">Select which modules and actions this role can access.</p>

                <div className="rp-perm-table-wrap">
                  <table className="rp-perm-table">
                    <thead>
                      <tr>
                        <th>Module</th>
                        <th>All</th>
                        <th>View</th>
                        <th>Create</th>
                        <th>Edit</th>
                        <th>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map(mod => {
                        const allChecked = ACTIONS.every(a => formData.permissions[mod]?.[a]);
                        return (
                          <tr key={mod}>
                            <td className="rp-mod-name">{mod}</td>
                            <td className="rp-cb-cell">
                              <input
                                type="checkbox"
                                className="rp-checkbox"
                                checked={allChecked}
                                onChange={() => handleSelectAll(mod)}
                                title="Toggle All"
                              />
                            </td>
                            {ACTIONS.map(action => (
                              <td key={action} className="rp-cb-cell">
                                <input
                                  type="checkbox"
                                  className="rp-checkbox"
                                  checked={formData.permissions[mod]?.[action] || false}
                                  onChange={() => handleCheckboxChange(mod, action)}
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
              <div className="pg-modal-footer">
                <button type="button" className="pg-btn pg-btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="pg-btn pg-btn-primary">
                  {isEdit ? 'Update Role' : 'Create Role'}
                </button>
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

export default RolesAndPermissions;
