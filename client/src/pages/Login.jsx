import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaLeaf, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);

      // ✨ UPDATED REDIRECT LOGIC:
      // - If they were sent here from a protected page, honor that
      // - Otherwise: Admin → /admin, Farmer → /farmer, Customer → / (home)
      const redirectTo =
        location.state?.from?.pathname ||
        (user.role === 'admin'
          ? '/admin'
          : user.role === 'farmer'
          ? '/farmer'
          : '/');  // ← Customers go to Home page

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      {/* LEFT PANEL: Brand Showcase */}
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-left-logo">
            <FaLeaf /> <span>MarketLink</span>
          </Link>
          <h1 className="auth-left-title">
            Fresh From Local Farms,<br /> Just a Click Away.
          </h1>
          <p className="auth-left-subtitle">
            Join thousands of families buying fresh, seasonal produce directly from local farmers.
          </p>
          <div className="auth-left-features">
            <div className="auth-feature">
              <span className="auth-feature-dot"></span>
              Pre-order your basket in seconds
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot"></span>
              Skip the market lines on pickup day
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot"></span>
              Support local farmers in your area
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div className="auth-right">
        <div className="auth-form-box">
          <div className="auth-form-header">
            <h2>Welcome Back</h2>
            <p>Login to continue to your MarketLink account</p>
          </div>

          {successMessage && <div className="auth-success">{successMessage}</div>}
          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-icon-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  type="email" name="email" required
                  value={form.email} onChange={handleChange}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-icon-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password" required
                  value={form.password} onChange={handleChange}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>
          </div>

          <Link to="/" className="back-home-btn">
            <FaArrowLeft className="back-home-icon" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;