import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const AuthOtp = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e) => {
    // Only allow numbers and max length 6
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.warning('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const { data } = await apiClient.post('/auth/verify-signup-otp', { email, otp });
      
      // Using context to save user data
      login(data.user, data.token, data.refreshToken);
      toast.success('Registration completed successfully!');
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('OTP verification error', error);
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="auth-wrapper">
      <div className="auth-glass-card">
        <h1 className="auth-title">Verify Email</h1>
        <p className="auth-subtitle">
          We've sent a 6-digit OTP to <br/>
          <strong style={{color: '#f8fafc'}}>{email}</strong>
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label htmlFor="otp" style={{textAlign: 'center', width: '100%'}}>Enter OTP</label>
            <input 
              type="text" 
              id="otp"
              name="otp"
              className="auth-input" 
              placeholder="123456" 
              value={otp}
              onChange={handleChange}
              style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.25rem' }}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading || otp.length < 6}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="auth-links">
          Didn't receive the code? <Link to="/signup" className="auth-link">Go back and try again</Link>
        </div>
      </div>
    </div>
  );
};

export default AuthOtp;
