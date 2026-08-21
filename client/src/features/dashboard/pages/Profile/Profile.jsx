import React, { useState, useEffect } from 'react';
import './Profile.css';
import api from '../../../../services/apiClient';
import { useAuth } from '../../../../context/AuthContext';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    website: '',
    phoneNumber: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        businessName: user.businessName || '',
        website: user.website || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put('/users/profile', formData);
      if (res.data.status) {
        toast.success(res.data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-filters">
        <h3 style={{ margin: 0, color: '#1e293b' }}>My Profile</h3>
      </div>

      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Full Name</label>
            <input 
              type="text" name="name" required
              value={formData.name} onChange={handleChange}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Email Address <small>(Contact support to change)</small></label>
            <input 
              type="email" name="email" disabled
              value={formData.email}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#94a3b8', outline: 'none', cursor: 'not-allowed' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Business Name</label>
            <input 
              type="text" name="businessName"
              value={formData.businessName} onChange={handleChange}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              placeholder="e.g. Acme Corp"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Phone Number</label>
            <input 
              type="text" name="phoneNumber"
              value={formData.phoneNumber} onChange={handleChange}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              placeholder="+91 9876543210"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 }}>Website URL</label>
            <input 
              type="url" name="website"
              value={formData.website} onChange={handleChange}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              placeholder="https://example.com"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Saving...' : 'Save Profile Details'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
