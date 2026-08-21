import React, { useState, useEffect } from 'react';
import './RolesAndPermissions.css';
import api from '../../../../services/apiClient';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

// The modules available in our payment gateway system
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

const RolesAndPermissions = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {}
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/roles');
      setRoles(data.roles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEdit(false);
    setSelectedRoleId(null);
    setFormData({
      name: '',
      description: '',
      permissions: MODULES.reduce((acc, mod) => {
        acc[mod] = { view: false, create: false, edit: false, delete: false };
        return acc;
      }, {})
    });
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    setIsEdit(true);
    setSelectedRoleId(role._id);
    
    // Ensure all modules exist in permissions object
    const perms = { ...role.permissions };
    MODULES.forEach(mod => {
      if (!perms[mod]) {
        perms[mod] = { view: false, create: false, edit: false, delete: false };
      }
    });

    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: perms
    });
    setIsModalOpen(true);
  };

  const closePermissionModal = () => {
    setIsModalOpen(false);
  };

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

  const handleSaveRole = async (e) => {
    e.preventDefault();

    try {
      if (isEdit) {
        await api.put(`/roles/${selectedRoleId}`, formData);
        toast.success('Role updated successfully!');
      } else {
        await api.post(`/roles`, formData);
        toast.success('Role created successfully!');
      }
      fetchRoles();
      closePermissionModal();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error(error.response?.data?.message || 'Failed to save role');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;
    try {
      await api.delete(`/roles/${roleId}`);
      toast.success('Role deleted successfully!');
      fetchRoles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading roles...</div>;
  }

  return (
    <div className="payment-page">
      <div className="payment-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Roles & Permissions</h3>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>Define access levels for each staff role</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiPlus /> Create Role
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ROLE NAME</th>
              <th>DESCRIPTION</th>
              <th>MEMBERS</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role._id}>
                <td style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '24px', height: '24px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                    ⛨
                  </div>
                  {role.name}
                </td>
                <td style={{ color: '#64748b' }}>{role.description || '-'}</td>
                <td style={{ fontWeight: 500 }}>{role.members || 0}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    {!role.isSystem && (
                      <>
                        <button 
                          onClick={() => openEditModal(role)}
                          style={{ padding: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', color: '#475569' }}
                        >
                          <FiEdit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteRole(role._id)}
                          style={{ padding: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', color: '#ef4444' }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </>
                    )}
                    {role.isSystem && (
                      <span style={{ fontSize: '12px', color: '#94a3b8', background: '#f1f5f9', padding: '4px 8px', borderRadius: '12px' }}>System Role</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center" style={{ padding: '2rem' }}>
                  No roles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT ROLE MODAL */}
      {isModalOpen && (
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
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.5rem' }}>
                {isEdit ? 'Edit Role' : 'Create New Role'}
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Define details and module permissions</p>
            </div>
            
            <form onSubmit={handleSaveRole} style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
              
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>ROLE DETAILS</h4>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500, fontSize: '13px' }}>Role Name *</label>
                    <input 
                      type="text" required value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                      placeholder="e.g. Content Manager"
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500, fontSize: '13px' }}>Description</label>
                    <input 
                      type="text" value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                      placeholder="Brief description of this role's responsibilities"
                    />
                  </div>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>MODULE PERMISSIONS</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Select which modules and actions this role can access.</p>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 20px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>MODULE</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>VIEW</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>CREATE</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>EDIT</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>DELETE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map(mod => (
                      <tr key={mod} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 20px', fontWeight: 500, color: '#334155', fontSize: '14px' }}>{mod}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={formData.permissions[mod]?.view || false} onChange={() => handleCheckboxChange(mod, 'view')} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={formData.permissions[mod]?.create || false} onChange={() => handleCheckboxChange(mod, 'create')} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={formData.permissions[mod]?.edit || false} onChange={() => handleCheckboxChange(mod, 'edit')} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={formData.permissions[mod]?.delete || false} onChange={() => handleCheckboxChange(mod, 'delete')} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  onClick={closePermissionModal}
                  style={{
                    padding: '10px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1',
                    borderRadius: '8px', color: '#475569', cursor: 'pointer', fontWeight: 500
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>
                  {isEdit ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesAndPermissions;
