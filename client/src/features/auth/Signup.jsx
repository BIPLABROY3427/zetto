import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiUserPlus } from 'react-icons/fi';
import './Auth.css';
import AuthBrand from './AuthBrand';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.warning('Please fill all fields');
      return;
    }
    if (formData.password.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }
    try {
      setLoading(true);
      await apiClient.post('/auth/signup', formData);
      toast.success('OTP sent to your email!');
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (err) {
      console.error('Signup error', err);
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
            <FiUserPlus />
          </div>
          <h1 className="auth-card-title">Create account</h1>
          <p className="auth-card-sub">Join Zetto and start accepting payments today</p>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="name">Full Name</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><FiUser /></span>
                <input
                  type="text" id="name" name="name"
                  className="auth-input with-icon"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Email Address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><FiMail /></span>
                <input
                  type="email" id="email" name="email"
                  className="auth-input with-icon"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><FiLock /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password" name="password"
                  className="auth-input with-icon with-right"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button" className="auth-input-toggle"
                  onClick={() => setShowPassword(s => !s)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
              {formData.password.length > 0 && (
                <div style={{
                  marginTop: 6, height: 4, borderRadius: 2, background: '#e2e8f0',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%', borderRadius: 2, transition: 'width 0.3s, background 0.3s',
                    width: formData.password.length < 6 ? '33%' : formData.password.length < 10 ? '66%' : '100%',
                    background: formData.password.length < 6 ? '#ef4444' : formData.password.length < 10 ? '#f59e0b' : '#16a34a'
                  }} />
                </div>
              )}
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading
                ? <><span className="auth-spinner" /><span>Sending OTP...</span></>
                : 'Create Account'
              }
            </button>
          </form>

          <div className="auth-bottom">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;
