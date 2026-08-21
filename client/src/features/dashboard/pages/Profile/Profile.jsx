import React, { useState, useEffect } from 'react';
import api from '../../../../services/apiClient';
import { useAuth } from '../../../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUser, FiSave } from 'react-icons/fi';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', businessName: '', website: '', phoneNumber: ''
  });

  useEffect(() => {
    if (user) setFormData({
      name: user.name || '', email: user.email || '',
      businessName: user.businessName || '',
      website: user.website || '', phoneNumber: user.phoneNumber || ''
    });
  }, [user]);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put('/users/profile', formData);
      if (res.data.status) toast.success(res.data.message || 'Profile updated!');
    } catch { /* handled by apiClient */ }
    finally { setLoading(false); }
  };

  const initials = (formData.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="pg-root">
      <div className="pg-toolbar">
        <div>
          <h3 className="prf-heading">My Profile</h3>
          <p className="prf-sub">Manage your personal and business details</p>
        </div>
      </div>

      <div className="prf-layout">
        {/* Avatar Card */}
        <div className="pg-card prf-avatar-card">
          <div className="prf-avatar">{initials}</div>
          <p className="prf-avatar-name">{formData.name || 'User'}</p>
          <p className="prf-avatar-email">{formData.email}</p>
          <div className="pg-divider" />
          <div className="pg-info-item">
            <span className="pg-info-label">Role</span>
            <span className="prf-role-badge">{user?.role || 'user'}</span>
          </div>
          {formData.businessName && (
            <div className="pg-info-item" style={{ marginTop: '0.75rem' }}>
              <span className="pg-info-label">Business</span>
              <span className="pg-info-value">{formData.businessName}</span>
            </div>
          )}
        </div>

        {/* Edit Form */}
        <div className="pg-card prf-form-card">
          <div className="pg-card-header">
            <h4 className="pg-card-title">
              <span className="pg-card-title-icon"><FiUser /></span>
              Edit Profile
            </h4>
          </div>
          <form onSubmit={handleSubmit} className="pg-card-body pg-form">
            <div className="pg-form-row-2">
              <div className="pg-form-row">
                <label className="pg-label"><span className="pg-label-req">*</span> Full Name</label>
                <input type="text" name="name" required className="pg-field"
                  placeholder="Enter your full name" value={formData.name} onChange={handleChange} />
              </div>
              <div className="pg-form-row">
                <label className="pg-label">Email Address</label>
                <input type="email" name="email" disabled className="pg-field"
                  value={formData.email} title="Contact support to change email" />
                <small className="prf-hint">Contact support to change email</small>
              </div>
            </div>
            <div className="pg-form-row-2">
              <div className="pg-form-row">
                <label className="pg-label">Business Name</label>
                <input type="text" name="businessName" className="pg-field"
                  placeholder="e.g. Acme Corp" value={formData.businessName} onChange={handleChange} />
              </div>
              <div className="pg-form-row">
                <label className="pg-label">Phone Number</label>
                <input type="text" name="phoneNumber" className="pg-field"
                  placeholder="+91 9876543210" value={formData.phoneNumber} onChange={handleChange} />
              </div>
            </div>
            <div className="pg-form-row">
              <label className="pg-label">Website URL</label>
              <input type="url" name="website" className="pg-field"
                placeholder="https://example.com" value={formData.website} onChange={handleChange} />
            </div>
            <div className="prf-actions">
              <button type="submit" className="pg-btn pg-btn-primary" disabled={loading}>
                <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
