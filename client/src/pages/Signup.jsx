import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaLeaf, FaEnvelope, FaLock, FaUser, FaPhone, FaMapMarkerAlt,
  FaStore, FaEye, FaEyeSlash, FaArrowLeft, FaCheckCircle,
  FaClock, FaCalendarAlt, FaInfoCircle
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Auth.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Signup = () => {
  const navigate = useNavigate();
  const { registerCustomer, registerFarmer } = useAuth();

  const [tab, setTab] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [availableMarkets, setAvailableMarkets] = useState([]);
  const [marketsLoading, setMarketsLoading] = useState(false);

  // ---------- CUSTOMER FORM ----------
  const [customerForm, setCustomerForm] = useState({
    name: '', email: '', password: '', phone: '', address: '',
  });

  // ---------- FARMER FORM ----------
  const [farmerForm, setFarmerForm] = useState({
    name: '', email: '', password: '', phone: '', address: '',
    stallName: '', contactPerson: '', description: '',
    locationAddress: '',
    selectedMarkets: [],
  });

  // ============ FETCH MARKETS ON MOUNT ============
  useEffect(() => {
    const fetchMarkets = async () => {
      setMarketsLoading(true);
      try {
        const res = await api.get('/markets');
        setAvailableMarkets(res.data.data || []);
      } catch (err) {
        console.error('Failed to load markets:', err);
      } finally {
        setMarketsLoading(false);
      }
    };
    fetchMarkets();
  }, []);

  // ============ COMPUTE OPERATING DAYS FROM SELECTED MARKETS ============
  // Union of all days from selected markets
  const computedOperatingDays = Array.from(
    new Set(
      farmerForm.selectedMarkets.flatMap((id) => {
        const market = availableMarkets.find((m) => m._id === id);
        return market?.operatingDays || [];
      })
    )
  ).sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));

  // ============ COMPUTE PICKUP WINDOW FROM SELECTED MARKETS ============
  // Use the earliest open time and latest close time across all selected markets
  const computedPickupWindow = (() => {
    if (farmerForm.selectedMarkets.length === 0) return null;
    const selected = farmerForm.selectedMarkets
      .map((id) => availableMarkets.find((m) => m._id === id))
      .filter(Boolean);
    if (selected.length === 0) return null;

    const openTimes = selected.map((m) => m.timings?.open).filter(Boolean);
    const closeTimes = selected.map((m) => m.timings?.close).filter(Boolean);
    const firstDay = computedOperatingDays[0] || 'Sat';

    return {
      day: firstDay,
      startTime: openTimes.length ? openTimes.sort()[0] : '08:00',
      endTime: closeTimes.length ? closeTimes.sort().reverse()[0] : '12:00',
    };
  })();

  const handleCustomerChange = (e) =>
    setCustomerForm({ ...customerForm, [e.target.name]: e.target.value });

  const handleFarmerChange = (e) =>
    setFarmerForm({ ...farmerForm, [e.target.name]: e.target.value });

  const toggleMarket = (marketId) => {
    setFarmerForm((prev) => {
      const isSelected = prev.selectedMarkets.includes(marketId);
      const newSelected = isSelected
        ? prev.selectedMarkets.filter((id) => id !== marketId)
        : [...prev.selectedMarkets, marketId];
      return { ...prev, selectedMarkets: newSelected };
    });
  };

  // ============ SUBMIT: CUSTOMER ============
  const submitCustomer = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      await registerCustomer(customerForm);
      setSuccess('🎉 Account created! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { message: 'Account created successfully! Please log in.' },
        });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // ============ SUBMIT: FARMER ============
  const submitFarmer = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);

    if (farmerForm.selectedMarkets.length === 0) {
      setError('Please select at least one market.');
      setLoading(false);
      return;
    }

    // Use computed operating days from markets
    const operatingDays = computedOperatingDays;

    // Use computed pickup window from markets
    const pickupWindows = computedPickupWindow
      ? [{
          day: computedPickupWindow.day,
          startTime: computedPickupWindow.startTime,
          endTime: computedPickupWindow.endTime,
        }]
      : [];

    try {
      await registerFarmer({
        name: farmerForm.name,
        email: farmerForm.email,
        password: farmerForm.password,
        phone: farmerForm.phone,
        address: farmerForm.address,
        stallName: farmerForm.stallName,
        contactPerson: farmerForm.contactPerson,
        description: farmerForm.description,
        operatingDays,
        pickupWindows,
        markets: farmerForm.selectedMarkets,
        location: farmerForm.locationAddress
          ? { address: farmerForm.locationAddress, lat: 0, lng: 0 }
          : undefined,
      });

      setSuccess('🎉 Registered! Waiting for admin approval...');
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { message: 'Farmer account created! Please wait for admin approval.' },
        });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      {/* LEFT PANEL */}
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-left-logo">
            <FaLeaf /> <span>MarketLink</span>
          </Link>
          <h1 className="auth-left-title">
            Join the Fresh<br /> Food Movement.
          </h1>
          <p className="auth-left-subtitle">
            Whether you're a farmer looking to grow your reach or a customer craving fresh food, MarketLink is for you.
          </p>
          <div className="auth-left-features">
            <div className="auth-feature">
              <span className="auth-feature-dot"></span>
              Customers pre-order from local stalls
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot"></span>
              Farmers manage inventory & orders
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot"></span>
              Pickup fresh at the market, pay in person
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right">
        <div className="auth-form-box auth-form-box-wide">
          <div className="auth-form-header">
            <h2>Create Your Account</h2>
            <p>Join the MarketLink community</p>
          </div>

          {/* TABS */}
          <div className="auth-tabs">
            <button
              type="button"
              className={tab === 'customer' ? 'auth-tab active' : 'auth-tab'}
              onClick={() => { setTab('customer'); setError(''); setSuccess(''); }}
            >
              👤 I'm a Customer
            </button>
            <button
              type="button"
              className={tab === 'farmer' ? 'auth-tab active' : 'auth-tab'}
              onClick={() => { setTab('farmer'); setError(''); setSuccess(''); }}
            >
              🌱 I'm a Farmer
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          {/* ============ CUSTOMER FORM ============ */}
          {tab === 'customer' && (
            <form onSubmit={submitCustomer} className="auth-form">
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-icon-wrapper">
                  <FaUser className="input-icon" />
                  <input type="text" name="name" required value={customerForm.name} onChange={handleCustomerChange} placeholder="Ali Khan" />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-icon-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input type="email" name="email" required value={customerForm.email} onChange={handleCustomerChange} placeholder="you@example.com" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <div className="input-icon-wrapper">
                    <FaPhone className="input-icon" />
                    <input type="tel" name="phone" required value={customerForm.phone} onChange={handleCustomerChange} placeholder="03001234567" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <div className="input-icon-wrapper">
                    <FaMapMarkerAlt className="input-icon" />
                    <input type="text" name="address" value={customerForm.address} onChange={handleCustomerChange} placeholder="Karachi" />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-icon-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password" required minLength={6}
                    value={customerForm.password} onChange={handleCustomerChange}
                    placeholder="Minimum 6 characters"
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up as Customer'}
              </button>
            </form>
          )}

          {/* ============ FARMER FORM ============ */}
          {tab === 'farmer' && (
            <form onSubmit={submitFarmer} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Your Name</label>
                  <div className="input-icon-wrapper">
                    <FaUser className="input-icon" />
                    <input type="text" name="name" required value={farmerForm.name} onChange={handleFarmerChange} placeholder="Bilal Ahmed" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Stall / Farm Name</label>
                  <div className="input-icon-wrapper">
                    <FaStore className="input-icon" />
                    <input type="text" name="stallName" required value={farmerForm.stallName} onChange={handleFarmerChange} placeholder="Fresh Farms" />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <div className="input-icon-wrapper">
                    <FaEnvelope className="input-icon" />
                    <input type="email" name="email" required value={farmerForm.email} onChange={handleFarmerChange} placeholder="farm@example.com" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <div className="input-icon-wrapper">
                    <FaPhone className="input-icon" />
                    <input type="tel" name="phone" required value={farmerForm.phone} onChange={handleFarmerChange} placeholder="03001234567" />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Person</label>
                  <div className="input-icon-wrapper">
                    <FaUser className="input-icon" />
                    <input type="text" name="contactPerson" required value={farmerForm.contactPerson} onChange={handleFarmerChange} placeholder="Bilal" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Pickup Address</label>
                  <div className="input-icon-wrapper">
                    <FaMapMarkerAlt className="input-icon" />
                    <input type="text" name="locationAddress" value={farmerForm.locationAddress} onChange={handleFarmerChange} placeholder="Empress Market, Karachi" />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" rows="2" value={farmerForm.description} onChange={handleFarmerChange} placeholder="Tell customers about your farm..."></textarea>
              </div>

              {/* ═══════════════════════════════════════════ */}
              {/* MARKET SELECTION */}
              {/* ═══════════════════════════════════════════ */}
              <div className="form-group">
                <label>
                  Select Market(s) You Sell At
                  <span className="form-hint">  (Operating days & times will be set automatically)</span>
                </label>
                {marketsLoading ? (
                  <div className="market-select-loading">Loading markets...</div>
                ) : availableMarkets.length === 0 ? (
                  <div className="market-select-empty">
                    No markets available yet. Please try again later.
                  </div>
                ) : (
                  <div className="market-select-grid">
                    {availableMarkets.map((market) => {
                      const isSelected = farmerForm.selectedMarkets.includes(market._id);
                      return (
                        <button
                          key={market._id}
                          type="button"
                          className={isSelected ? 'market-select-card active' : 'market-select-card'}
                          onClick={() => toggleMarket(market._id)}
                        >
                          <div className="market-select-icon">
                            {isSelected ? <FaCheckCircle /> : <FaStore />}
                          </div>
                          <div className="market-select-info">
                            <span className="market-select-name">{market.name}</span>
                            <span className="market-select-address">{market.address}</span>
                            <span className="market-select-meta">
                              <FaCalendarAlt /> {market.operatingDays?.join(', ') || '—'}
                              <span className="market-meta-sep">·</span>
                              <FaClock /> {market.timings?.open}–{market.timings?.close}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ═══════════════════════════════════════════ */}
              {/* AUTO-DERIVED OPERATING DAYS (READ-ONLY) */}
              {/* ═══════════════════════════════════════════ */}
              {farmerForm.selectedMarkets.length > 0 && (
                <>
                  <div className="form-group">
                    <label>
                      Your Operating Days
                      <span className="form-hint">  (Auto-set from selected markets)</span>
                    </label>
                    <div className="operating-days-preview">
                      {DAYS.map((day) => (
                        <span
                          key={day}
                          className={
                            computedOperatingDays.includes(day)
                              ? 'day-pill-preview active'
                              : 'day-pill-preview'
                          }
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>

                  {computedPickupWindow && (
                    <div className="form-group">
                      <label>
                        Your Pickup Window
                        <span className="form-hint">  (Auto-set from selected markets)</span>
                      </label>
                      <div className="pickup-window-preview">
                        <FaClock className="preview-icon" />
                        <span>
                          {computedPickupWindow.day}: {computedPickupWindow.startTime} — {computedPickupWindow.endTime}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {farmerForm.selectedMarkets.length === 0 && (
                <div className="info-box info-box-blue">
                  <FaInfoCircle /> Select a market above to automatically set your operating days and pickup window.
                </div>
              )}

              <div className="form-group">
                <label>Password</label>
                <div className="input-icon-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password" required minLength={6}
                    value={farmerForm.password} onChange={handleFarmerChange}
                    placeholder="Minimum 6 characters"
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="info-box">
                ℹ️ Farmer accounts require <strong>admin approval</strong>.
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Submitting...' : 'Sign Up as Farmer'}
              </button>
            </form>
          )}

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </div>

          <Link to="/" className="back-home-btn">
            <FaArrowLeft className="back-home-icon" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;