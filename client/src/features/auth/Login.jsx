import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
      // Navigation is now handled by the useEffect above once the user state updates
    } catch (error) {
      console.error('Login error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-glass-card" style={{ padding: '3.5rem', maxWidth: '420px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
             <FiLogIn size={28} color="#8b5cf6" />
          </div>
          <h1 className="auth-title" style={{ fontSize: '1.75rem' }}>Welcome Back</h1>
          <p className="auth-subtitle" style={{ marginBottom: 0, marginTop: '0.5rem' }}>Securely access your Zetto.in dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="auth-input-group" style={{ position: 'relative' }}>
            <label htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1.2rem' }} />
              <input 
                type="email" 
                id="email"
                name="email"
                className="auth-input" 
                placeholder="name@example.com" 
                value={formData.email}
                onChange={handleChange}
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div className="auth-input-group" style={{ position: 'relative', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
              <Link 
                to="/forget" 
                style={{ fontSize: '0.85rem', color: '#8b5cf6', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color = '#a78bfa'}
                onMouseLeave={(e) => e.target.style.color = '#8b5cf6'}
              >
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1.2rem' }} />
              <input 
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className="auth-input" 
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleChange}
                style={{ paddingLeft: '44px', paddingRight: '44px' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, display: 'flex' }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-btn" 
            disabled={loading}
            style={{ 
              marginTop: '2rem', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '8px',
              padding: '1rem',
              fontSize: '1.05rem',
              boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.39)'
            }}
          >
            {loading ? (
              <>
                <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderRadius: '50%', borderTopColor: '#fff', animation: 'spin 1s ease-in-out infinite' }} />
                <span>Logging in...</span>
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div className="auth-links" style={{ marginTop: '2.5rem' }}>
          Don't have an account? <Link to="/signup" className="auth-link" style={{ fontWeight: 600 }}>Create one</Link>
        </div>
      </div>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Login;
