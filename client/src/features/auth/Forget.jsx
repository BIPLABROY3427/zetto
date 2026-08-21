import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiKey } from 'react-icons/fi';
import './Auth.css';
import AuthBrand from './AuthBrand';

const ForgetPw = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) { toast.warning('Please enter your email'); return; }
    try {
      setLoading(true);
      await apiClient.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      console.error('Forgot password error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) { toast.warning('Please enter OTP and new password'); return; }
    if (newPassword.length < 6) { toast.warning('Password must be at least 6 characters'); return; }
    try {
      setLoading(true);
      await apiClient.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      console.error('Reset password error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthBrand />

      <div className="auth-form-panel">
        <div className="auth-form-card">

          <div className="auth-card-icon">
            <FiKey />
          </div>

          {/* Step indicator */}
          <div className="auth-steps">
            <div className={`auth-step ${step >= 1 ? 'active' : ''}`} />
            <div className={`auth-step ${step >= 2 ? 'active' : ''}`} />
          </div>

          <h1 className="auth-card-title">
            {step === 1 ? 'Forgot password?' : 'Reset password'}
          </h1>
          <p className="auth-card-sub">
            {step === 1
              ? 'Enter your registered email and we\'ll send you a reset OTP.'
              : `Enter the OTP sent to ${email} and choose a new password.`
            }
          </p>

          {step === 1 ? (
            <form onSubmit={handleSendOtp}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">Email Address</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><FiMail /></span>
                  <input
                    type="email" id="email"
                    className="auth-input with-icon"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading
                  ? <><span className="auth-spinner" /><span>Sending OTP...</span></>
                  : 'Send OTP'
                }
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="auth-info-box">
                📧 OTP has been sent to <strong>{email}</strong>. Please check your inbox or spam folder.
              </div>

              {/* OTP */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="otp">6-Digit OTP</label>
                <input
                  type="text" id="otp"
                  className="auth-input"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.2rem', fontWeight: 700 }}
                />
              </div>

              {/* New Password */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="newPassword">New Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><FiLock /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    className="auth-input with-icon with-right"
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button" className="auth-input-toggle"
                    onClick={() => setShowPassword(s => !s)}
                  >
                    {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" className="auth-submit"
                disabled={loading || otp.length < 6 || newPassword.length < 6}
              >
                {loading
                  ? <><span className="auth-spinner" /><span>Resetting...</span></>
                  : 'Reset Password'
                }
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); setNewPassword(''); }}
                style={{
                  width: '100%', marginTop: '0.75rem', background: 'none',
                  border: 'none', color: '#64748b', cursor: 'pointer',
                  font: 'inherit', fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                <FiArrowLeft size={14} /> Back to email
              </button>
            </form>
          )}

          <div className="auth-bottom">
            Remember your password? <Link to="/login">Sign in</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgetPw;
