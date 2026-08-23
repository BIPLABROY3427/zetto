import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiShield, FiRefreshCw } from 'react-icons/fi';
import './Auth.css';
import AuthBrand from './AuthBrand';

const AuthOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const refs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      toast.error('No signup session found. Please sign up first.');
      navigate('/signup');
    }
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Focus first box on mount
  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const handleBoxChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  const handleBoxKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const updated = [...otp];
    pasted.split('').forEach((d, i) => { updated[i] = d; });
    setOtp(updated);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const otpValue = otp.join('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      toast.warning('Please enter the full 6-digit OTP');
      return;
    }
    try {
      setLoading(true);
      const { data } = await apiClient.post('/auth/verify-signup-otp', { email, otp: otpValue });
      login(data.user, data.token, data.refreshToken);
      toast.success('Registration completed successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error('OTP verification error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      setResending(true);
      await apiClient.post('/auth/resend-signup-otp', { email });
      toast.success('New OTP sent!');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="auth-page">
      <AuthBrand />

      <div className="auth-form-panel">
        <div className="auth-form-card">

          <div className="auth-card-icon">
            <FiShield />
          </div>
          <h1 className="auth-card-title">Verify your email</h1>
          <p className="auth-card-sub">
            We sent a 6-digit code to<br />
            <strong style={{ color: '#1b2559' }}>{email}</strong>
          </p>

          <form onSubmit={handleSubmit}>
            {/* OTP Boxes */}
            <div style={{
              display: 'flex', gap: '0.5rem', justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => refs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleBoxChange(i, e.target.value)}
                  onKeyDown={e => handleBoxKeyDown(i, e)}
                  onPaste={handlePaste}
                  style={{
                    width: '48px', height: '56px',
                    textAlign: 'center',
                    fontSize: '1.4rem', fontWeight: 700,
                    border: `2px solid ${digit ? '#0066ff' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    background: digit ? '#eff6ff' : '#f8fafc',
                    color: '#1b2559',
                    outline: 'none',
                    fontFamily: 'Inter, monospace',
                    transition: 'border-color 0.15s, background 0.15s',
                    cursor: 'text',
                  }}
                  onFocus={e => e.target.style.borderColor = '#0066ff'}
                  onBlur={e => e.target.style.borderColor = digit ? '#0066ff' : '#e2e8f0'}
                />
              ))}
            </div>

            <button
              type="submit" className="auth-submit"
              disabled={loading || otpValue.length < 6}
            >
              {loading
                ? <><span className="auth-spinner" /><span>Verifying...</span></>
                : 'Verify Email'
              }
            </button>
          </form>

          {/* Resend */}
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.5rem' }}>
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              style={{
                background: 'none', border: 'none', cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                color: countdown > 0 ? '#94a3b8' : '#0066ff',
                fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: 0, transition: 'color 0.15s',
              }}
            >
              <FiRefreshCw size={13} />
              {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>
          </div>

          <div className="auth-bottom">
            Wrong email? <Link to="/signup">Go back</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthOtp;
