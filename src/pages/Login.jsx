import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success('Login successful!');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Redirect based on role
      if (user.role === 'student') {
        navigate('/student');
      } else if (user.role === 'faculty' || user.role === 'admin') {
        navigate('/faculty');
      } else {
        navigate('/');
      }
    } else {
      toast.error(result.message || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="auth-split-container">
      {/* Left Side - Form */}
      <div className="auth-form-section">
        <div className="auth-form-content">
          <h1 className="auth-brand-title">SmartAttend</h1>
          <p className="auth-brand-subtitle">Authentication Portal</p>

          <div className="auth-tabs">
            <Link to="/login" className="auth-tab active">Login</Link>
            <Link to="/register" className="auth-tab">Register</Link>
          </div>

          <div className="auth-welcome">
            <h2 className="welcome-title">Welcome back</h2>
            <p className="welcome-subtitle">Enter your credentials to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 6.66667L10 11.6667L17.5 6.66667M3.33333 15H16.6667C17.5871 15 18.3333 14.2538 18.3333 13.3333V6.66667C18.3333 5.74619 17.5871 5 16.6667 5H3.33333C2.41286 5 1.66667 5.74619 1.66667 6.66667V13.3333C1.66667 14.2538 2.41286 15 3.33333 15Z" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.8333 9.16667H4.16667C3.24619 9.16667 2.5 9.91286 2.5 10.8333V16.6667C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6667V10.8333C17.5 9.91286 16.7538 9.16667 15.8333 9.16667Z" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.83333 9.16667V5.83333C5.83333 4.45262 6.95262 3.33333 8.33333 3.33333H11.6667C13.0474 3.33333 14.1667 4.45262 14.1667 5.83333V9.16667" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="form-input"
                />
              </div>
            </div>

            <button type="submit" className="btn-signin" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="auth-visual-section">
        <div className="auth-visual-content">
          <div className="shield-icon-large">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60 10L15 25V60C15 85 35 107.5 60 115C85 107.5 105 85 105 60V25L60 10Z" fill="white" fillOpacity="0.2"/>
              <path d="M60 10L15 25V60C15 85 35 107.5 60 115C85 107.5 105 85 105 60V25L60 10Z" stroke="white" strokeWidth="3"/>
              <path d="M45 60L52.5 67.5L75 45" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="visual-title">Secure & Verified Attendance</h2>
          <p className="visual-description">
            Using advanced biometrics and proximity sensors to ensure academic integrity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

