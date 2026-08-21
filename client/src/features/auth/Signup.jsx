import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { toast } from 'react-toastify';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.warning('Please fill in all fields');
      return;
    }

    if (formData.password.length < 6) {
      toast.warning('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const { data } = await apiClient.post('/auth/register', formData);
      
      if (data.requireOtp) {
          toast.success(data.message);
          // Redirect to OTP verification page
          navigate('/auth-otp', { state: { email: formData.email } });
      }
    } catch (error) {
      // apiClient handles toast errors already, so we just stop loading
      console.error('Signup error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-glass-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join Zetto.in to start managing your payments</p>
        
        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name"
              name="name"
              className="auth-input" 
              placeholder="John Doe" 
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email"
              name="email"
              className="auth-input" 
              placeholder="name@example.com" 
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password"
              name="password"
              className="auth-input" 
              placeholder="••••••••" 
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Sending OTP...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-links">
          Already have an account? <Link to="/login" className="auth-link">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
