import { useEffect, useState } from 'react';
import { FiBriefcase, FiCheck, FiCopy, FiEye, FiEyeOff, FiGlobe, FiKey, FiLock, FiMail, FiPhone, FiRefreshCw, FiSave, FiShield, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../services/apiClient';
import './AccountSettings.css';

const AccountSettings = () => {
  const { user, login } = useAuth();

  useEffect(() => {
    // Fetch latest profile on load to ensure KYC status is up to date
    api.get('/users/me').then(({ data }) => {
      if (data?.user) {
        const userData = { ...data.user, permissions: data.user.customRole ? data.user.customRole.permissions : null };
        login(userData, localStorage.getItem('getway_token'), localStorage.getItem('getway_refresh_token_fallback'));
      }
    }).catch(err => console.error('Failed to fetch latest profile:', err));
  }, []);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    businessName: user?.businessName || '',
    website: user?.website || '',
  });

  const [pwd, setPwd] = useState({ current: '', newPwd: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const [kycDocType, setKycDocType] = useState('Aadhar');
  const [kycFile, setKycFile] = useState(null);
  const [uploadingKyc, setUploadingKyc] = useState(false);

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const roleColor = { superadmin: '#dc2626', admin: '#2563eb', user: '#16a34a' }[user?.role] || '#2563eb';

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const { data } = await api.put('/users/profile', profile);
      toast.success('Profile updated!');
      if (data.user) {
        const userData = { ...data.user, permissions: data.user.customRole ? data.user.customRole.permissions : null };
        login(userData, localStorage.getItem('getway_token'), localStorage.getItem('getway_refresh_token_fallback'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwd.newPwd !== pwd.confirm) { toast.error('Passwords do not match'); return; }
    if (pwd.newPwd.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      setSavingPwd(true);
      const currentRefreshToken = localStorage.getItem('getway_refresh_token_fallback');
      await api.put('/auth/change-password', { 
        currentPassword: pwd.current, 
        newPassword: pwd.newPwd,
        currentRefreshToken 
      });
      toast.success('Password changed successfully!');
      setPwd({ current: '', newPwd: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSavingPwd(false); }
  };

  const handleKycUpload = async (e) => {
    e.preventDefault();
    if (!kycFile) return toast.error('Please select a document file');
    const formData = new FormData();
    formData.append('docType', kycDocType);
    formData.append('document', kycFile);
    try {
      setUploadingKyc(true);
      const { data } = await api.post('/users/kyc/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(data.message);
      login({ ...user, kycStatus: data.kycStatus, kycDocuments: data.kycDocuments }, localStorage.getItem('getway_token'), localStorage.getItem('getway_refresh_token_fallback'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload KYC');
    } finally {
      setUploadingKyc(false);
    }
  };

  return (
    <div className="pg-root">
      {/* Toolbar */}
      <div className="pg-toolbar">
        <div>
          <h3 className="as-heading">Account Settings</h3>
          <p className="as-sub">Manage your profile, security and preferences</p>
        </div>
      </div>

      {/* Identity Card */}
      <div className="as-identity-card">
        <div className="as-avatar" style={{ background: roleColor }}>
          {initials}
        </div>
        <div className="as-identity-info">
          <h3 className="as-identity-name">{user?.name}</h3>
          <p className="as-identity-email">{user?.email}</p>
          <span className="as-identity-role" style={{ background: `${roleColor}15`, color: roleColor, border: `1px solid ${roleColor}30` }}>
            {user?.role}
          </span>
        </div>
        {user?.isVip && <span className="as-vip-badge">VIP 👑</span>}
      </div>

      <div className="as-grid">
        {/* Profile Form */}
        <div className="pg-card">
          <div className="pg-card-header">
            <h4 className="pg-card-title">
              <span className="pg-card-title-icon"><FiUser /></span>
              Profile Information
            </h4>
          </div>
          <form onSubmit={handleProfileSave}>
            <div className="pg-card-body pg-form">
              <div className="pg-form-row-2">
                <div className="pg-form-row">
                  <label className="pg-label"><FiUser size={12} /> Full Name</label>
                  <input type="text" className="pg-field" value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="pg-form-row">
                  <label className="pg-label"><FiMail size={12} /> Email Address</label>
                  <input type="email" className="pg-field" value={profile.email}
                    onChange={e => setProfile({ ...profile, email: e.target.value })} />
                </div>
                <div className="pg-form-row">
                  <label className="pg-label"><FiPhone size={12} /> Phone Number</label>
                  <input type="text" className="pg-field" placeholder="+91 98765 43210" value={profile.phoneNumber}
                    onChange={e => setProfile({ ...profile, phoneNumber: e.target.value })} />
                </div>
                <div className="pg-form-row">
                  <label className="pg-label"><FiBriefcase size={12} /> Business Name</label>
                  <input type="text" className="pg-field" placeholder="Your company name" value={profile.businessName}
                    onChange={e => setProfile({ ...profile, businessName: e.target.value })} />
                </div>
                <div className="pg-form-row" style={{ gridColumn: 'span 2' }}>
                  <label className="pg-label"><FiGlobe size={12} /> Website URL</label>
                  <input type="url" className="pg-field" placeholder="https://yourwebsite.com" value={profile.website}
                    onChange={e => setProfile({ ...profile, website: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="pg-modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '1rem 1.5rem' }}>
              <button type="submit" className="pg-btn pg-btn-primary" disabled={savingProfile}>
                {savingProfile ? <><FiRefreshCw className="as-spin" /> Saving...</> : <><FiSave /> Save Profile</>}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="pg-card">
          <div className="pg-card-header">
            <h4 className="pg-card-title">
              <span className="pg-card-title-icon"><FiShield /></span>
              Change Password
            </h4>
          </div>
          <form onSubmit={handlePasswordChange}>
            <div className="pg-card-body pg-form">
              <div className="pg-form-row">
                <label className="pg-label"><FiLock size={12} /> Current Password</label>
                <div className="as-input-wrap">
                  <input type={showCurrent ? 'text' : 'password'} className="pg-field as-pwd-input"
                    placeholder="Enter current password" value={pwd.current}
                    onChange={e => setPwd({ ...pwd, current: e.target.value })} />
                  <button type="button" className="as-eye-btn" onClick={() => setShowCurrent(s => !s)}>
                    {showCurrent ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>
              <div className="pg-form-row">
                <label className="pg-label"><FiLock size={12} /> New Password</label>
                <div className="as-input-wrap">
                  <input type={showNew ? 'text' : 'password'} className="pg-field as-pwd-input"
                    placeholder="Min. 6 characters" value={pwd.newPwd}
                    onChange={e => setPwd({ ...pwd, newPwd: e.target.value })} />
                  <button type="button" className="as-eye-btn" onClick={() => setShowNew(s => !s)}>
                    {showNew ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
                {pwd.newPwd.length > 0 && (
                  <div className="as-pwd-strength">
                    <div className={`as-pwd-bar ${pwd.newPwd.length < 6 ? 'weak' : pwd.newPwd.length < 10 ? 'medium' : 'strong'}`} />
                    <span className="as-pwd-label">
                      {pwd.newPwd.length < 6 ? 'Weak' : pwd.newPwd.length < 10 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>
              <div className="pg-form-row">
                <label className="pg-label"><FiLock size={12} /> Confirm New Password</label>
                <input type="password" className={`pg-field ${pwd.confirm && pwd.confirm !== pwd.newPwd ? 'as-input-error' : ''}`}
                  placeholder="Re-enter new password" value={pwd.confirm}
                  onChange={e => setPwd({ ...pwd, confirm: e.target.value })} />
                {pwd.confirm && pwd.confirm !== pwd.newPwd && (
                  <p className="as-error-msg">Passwords do not match</p>
                )}
              </div>

              {/* Security tips */}
              <div className="as-security-tips">
                <p className="as-tips-title"><FiShield size={13} /> Password requirements</p>
                <ul>
                  <li className={pwd.newPwd.length >= 6 ? 'done' : ''}>At least 6 characters</li>
                  <li className={/[A-Z]/.test(pwd.newPwd) ? 'done' : ''}>One uppercase letter</li>
                  <li className={/[0-9]/.test(pwd.newPwd) ? 'done' : ''}>One number</li>
                </ul>
              </div>
            </div>
            <div className="pg-modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '1rem 1.5rem' }}>
              <button type="submit" className="pg-btn pg-btn-primary"
                disabled={savingPwd || !pwd.current || pwd.newPwd.length < 6 || pwd.newPwd !== pwd.confirm}>
                {savingPwd ? <><FiRefreshCw className="as-spin" /> Changing...</> : <><FiShield /> Change Password</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* KYC Verification */}
      <div className="pg-card">
        <div className="pg-card-header">
          <h4 className="pg-card-title">
            <span className="pg-card-title-icon"><FiShield /></span>
            KYC Verification
          </h4>
          <span className={`pg-status ${user?.kycStatus === 'approved' ? 'pg-status-completed' : user?.kycStatus === 'rejected' ? 'pg-status-failed' : 'pg-status-pending'}`}>
            {user?.kycStatus === 'approved' ? 'Verified' : user?.kycStatus === 'submitted' ? 'Under Review' : user?.kycStatus === 'rejected' ? 'Rejected' : 'Pending'}
          </span>
        </div>
        <div className="pg-card-body">
          {user?.kycStatus === 'approved' ? (
            <div className="pg-empty" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
              <FiCheck size={24} style={{ marginBottom: 10 }} />
              <p>Your KYC has been successfully verified.</p>
            </div>
          ) : user?.kycStatus === 'submitted' ? (
            <div className="pg-empty" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
              <FiRefreshCw size={24} style={{ marginBottom: 10 }} className="as-spin" />
              <p>Your documents are currently under review by our team.</p>
            </div>
          ) : (
            <form onSubmit={handleKycUpload} className="pg-form">
              {user?.kycStatus === 'rejected' && (
                <div className="as-error-msg" style={{ marginBottom: '1rem', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                  <strong>Rejection Reason:</strong> {user.kycRejectionReason || 'Documents were invalid or unclear. Please re-upload.'}
                </div>
              )}
              <div className="pg-form-row">
                <label className="pg-label">Document Type</label>
                <select className="pg-field" value={kycDocType} onChange={e => setKycDocType(e.target.value)}>
                  <option value="Aadhar">Aadhar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="pg-form-row">
                <label className="pg-label">Upload Document</label>
                <input type="file" className="pg-field" accept="image/*,.pdf" onChange={e => setKycFile(e.target.files[0])} />
                <span className="pg-help-text">Max size: 5MB. Formats: JPG, PNG, PDF.</span>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <button type="submit" className="pg-btn pg-btn-primary" disabled={uploadingKyc || !kycFile}>
                  {uploadingKyc ? <><FiRefreshCw className="as-spin" /> Uploading...</> : 'Submit for Verification'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Account Info */}
      <div className="pg-card">
        <div className="pg-card-header">
          <h4 className="pg-card-title">
            <span className="pg-card-title-icon"><FiKey /></span>
            Account Information
          </h4>
        </div>
        <div className="pg-card-body">
          <div className="as-info-grid">
            <div className="as-info-item">
              <span className="pg-info-label">Account ID</span>
              <div className="as-copy-row">
                <span className="pg-info-value as-mono">{user?._id || user?.id || '—'}</span>
                <button className="as-copy-btn" onClick={() => { navigator.clipboard.writeText(user?._id || user?.id || ''); toast.success('Copied!'); }}>
                  <FiCopy size={13} />
                </button>
              </div>
            </div>
            <div className="as-info-item">
              <span className="pg-info-label">Role</span>
              <span className="pg-info-value">{user?.role}</span>
            </div>
            <div className="as-info-item">
              <span className="pg-info-label">Account Status</span>
              <span className={`pg-status ${user?.isActive !== false ? 'pg-status-completed' : 'pg-status-failed'}`}>
                {user?.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="as-info-item">
              <span className="pg-info-label">Services</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className={`pg-badge ${user?.isPayinEnabled !== false ? 'pg-badge-green' : 'pg-badge-gray'}`}>
                  PayIn {user?.isPayinEnabled !== false ? '✓' : '✗'}
                </span>
                <span className={`pg-badge ${user?.isPayoutEnabled !== false ? 'pg-badge-blue' : 'pg-badge-gray'}`}>
                  PayOut {user?.isPayoutEnabled !== false ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
