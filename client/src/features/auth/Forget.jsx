import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { toast } from 'react-toastify';

const ForgetPw = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.warning('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/auth/forgot-password', { email });
      toast.success('Password reset OTP sent to your email');
      setStep(2);
    } catch (error) {
      console.error('Forgot password error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!otp || !newPassword) {
      toast.warning('Please enter OTP and new password');
      return;
    }

    if (newPassword.length < 6) {
      toast.warning('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successful! You can now log in.');
      navigate('/login');
    } catch (error) {
      console.error('Reset password error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-glass-card">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">
          {step === 1 ? 'Enter your email to receive an OTP' : `Enter OTP sent to ${email}`}
        </p>
        
        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="auth-input-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email"
                className="auth-input" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="auth-input-group">
              <label htmlFor="otp">6-Digit OTP</label>
              <input 
                type="text" 
                id="otp"
                className="auth-input" 
                placeholder="123456" 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                style={{ letterSpacing: '0.2em' }}
              />
            </div>

            <div className="auth-input-group">
              <label htmlFor="newPassword">New Password</label>
              <input 
                type="password" 
                id="newPassword"
                className="auth-input" 
                placeholder="••••••••" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading || otp.length < 6 || newPassword.length < 6}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-links">
          Remember your password? <Link to="/login" className="auth-link">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgetPw;
