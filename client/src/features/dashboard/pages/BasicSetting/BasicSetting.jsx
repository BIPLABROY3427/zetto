import React from 'react';
import { useAuth } from '../../../../context/AuthContext';
import './BasicSetting.css';

const BasicSetting = () => {
  const { user } = useAuth();

  return (
    <div className="basic-setting-page">
      <div className="page-header">
        <h2>Basic Settings</h2>
      </div>

      <div className="settings-card">
        <h3>Profile Information</h3>
        <p className="settings-subtitle">Manage your account details and preferences.</p>
        
        <div className="settings-form">
          <div className="form-group">
            <label>Name</label>
            <input type="text" className="form-control" value={user?.name || ''} disabled />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="form-control" value={user?.email || ''} disabled />
          </div>
          <div className="form-group">
            <label>Role</label>
            <input type="text" className="form-control" value={user?.role || 'merchant'} disabled />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicSetting;
