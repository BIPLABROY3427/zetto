import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import './Auth.css';
import AuthBrand from './AuthBrand';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  React.useEffect(() => {
    if (user) {
      const origin = location.state?.from?.pathname || '/dashboard';
      navigate(origin, { replace: true });
    }
  }, [user, navigate, location]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.warning('Please enter email and password');
      return;
    }
    try {
      setLoading(true);
      const { data } = await apiClient.post('/auth/login', formData);
      login(data.user, data.token, data.refreshToken);
      toast.success('Welcome back!');
    } catch (err) {
      console.error('Login error', err);
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
            <FiLock />
          </div>
          <h1 className="auth-card-title">Welcome back</h1>
          <p className="auth-card-sub">Sign in to your Zetto dashboard</p>

          <form onSubmit={handleSubmit}>
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
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="password">Password</label>
                <Link to="/forget" className="auth-forgot">Forgot password?</Link>
              </div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><FiLock /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password" name="password"
                  className="auth-input with-icon with-right"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button" className="auth-input-toggle"
                  onClick={() => setShowPassword(s => !s)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <><span className="auth-spinner" /><span>Signing in...</span></> : 'Sign In'}
            </button>
          </form>

          <div className="auth-bottom">
            Don't have an account? <Link to="/signup">Create one</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
