import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave,
  FaTimes, FaLeaf, FaHeart, FaShoppingBag, FaStar,
  FaCheckCircle, FaSpinner, FaArrowLeft, FaTachometerAlt,
  FaHome, FaCloudUploadAlt
} from 'react-icons/fa';
import './CustomerProfile.css';

const CustomerProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        imageUrl: user.imageUrl || '',
      });
    }
  }, [user]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ============ PROFILE IMAGE UPLOAD ============
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be smaller than 5MB.');
      return;
    }

    setUploadError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newUrl = res.data.data.url;
      setForm((prev) => ({ ...prev, imageUrl: newUrl }));

      // Immediately save to backend so it reflects everywhere
      const profileRes = await api.put('/users/profile', {
        name: form.name,
        phone: form.phone,
        address: form.address,
        imageUrl: newUrl,
      });

      if (updateUser) updateUser(profileRes.data.data);
      setSuccess('Profile photo updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    setForm((prev) => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const res = await api.put('/users/profile', {
        name: form.name,
        phone: form.phone,
        address: form.address,
        imageUrl: '',
      });
      if (updateUser) updateUser(res.data.data);
      setSuccess('Profile photo removed.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setUploadError('Failed to remove photo.');
    }
  };

  // ============ SAVE PROFILE ============
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.put('/users/profile', form);
      const updatedUser = res.data.data;

      if (updateUser) updateUser(updatedUser);

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      imageUrl: user?.imageUrl || '',
    });
    setIsEditing(false);
    setError('');
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-empty">
          <FaUser className="empty-icon" />
          <h2>Please log in to view your profile</h2>
          <button className="empty-btn" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const getInitials = (name) =>
    name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '?';

  return (
    <div className="profile-page">
      {/* HEADER */}
      <div className="profile-header">
        <button className="profile-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        <h1 className="profile-title">
          <FaUser className="profile-title-icon" /> My Profile
        </h1>

        <div className="profile-header-actions">
          <Link to="/customer" className="profile-dashboard-btn">
            <FaTachometerAlt /> Go to Dashboard
          </Link>
        </div>
      </div>

      <div className="profile-container">
        {/* LEFT: Avatar & Quick Stats */}
        <div className="profile-sidebar">
          <div className="profile-avatar-card">
            {/* ✨ CLICKABLE AVATAR - matches farmer dashboard pattern */}
            <button
              type="button"
              className="cp-avatar-btn"
              onClick={() => !isUploading && fileInputRef.current?.click()}
              disabled={isUploading}
              title="Click to upload profile photo"
            >
              {form.imageUrl ? (
                <img src={form.imageUrl} alt={user.name} />
              ) : (
                <span className="cp-avatar-initial">
                  {getInitials(user.name)}
                </span>
              )}

              <span className="cp-avatar-overlay">
                {isUploading ? (
                  <FaSpinner className="spin" />
                ) : (
                  <>
                    <FaCloudUploadAlt />
                    <span>Upload</span>
                  </>
                )}
              </span>
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <h2 className="profile-name-large">{user.name}</h2>
            <span className="profile-role-badge">
              <FaLeaf /> {user.role}
            </span>

            {form.imageUrl && (
              <button
                type="button"
                className="cp-remove-photo"
                onClick={handleRemoveImage}
                disabled={isUploading}
              >
                <FaTimes /> Remove Photo
              </button>
            )}

            {uploadError && (
              <div className="cp-upload-error">{uploadError}</div>
            )}
          </div>

          <div className="profile-stats">
            <div className="profile-stat-item">
              <div className="profile-stat-icon green">
                <FaHeart />
              </div>
              <div className="profile-stat-info">
                <span className="profile-stat-number">{user.favorites?.length || 0}</span>
                <span className="profile-stat-label">Favorites</span>
              </div>
            </div>

            <div className="profile-stat-item">
              <div className="profile-stat-icon orange">
                <FaShoppingBag />
              </div>
              <div className="profile-stat-info">
                <span className="profile-stat-number">0</span>
                <span className="profile-stat-label">Orders</span>
              </div>
            </div>

            <div className="profile-stat-item">
              <div className="profile-stat-icon blue">
                <FaStar />
              </div>
              <div className="profile-stat-info">
                <span className="profile-stat-number">{user.totalReviews || 0}</span>
                <span className="profile-stat-label">Reviews</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Personal Info */}
        <div className="profile-main">
          <div className="profile-card">
            <div className="profile-card-header">
              <h2>Personal Information</h2>
              {!isEditing && (
                <button className="profile-edit-btn" onClick={() => setIsEditing(true)}>
                  <FaEdit /> Edit Profile
                </button>
              )}
            </div>

            {error && <div className="profile-alert error">{error}</div>}
            {success && <div className="profile-alert success">{success}</div>}

            {isEditing ? (
              <form onSubmit={handleSave} className="profile-form">
                <div className="profile-form-group">
                  <label>Full Name</label>
                  <div className="profile-input-wrapper">
                    <FaUser className="profile-input-icon" />
                    <input
                      type="text" name="name"
                      value={form.name} onChange={handleChange}
                      required placeholder="Your full name"
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label>Phone Number</label>
                  <div className="profile-input-wrapper">
                    <FaPhone className="profile-input-icon" />
                    <input
                      type="tel" name="phone"
                      value={form.phone} onChange={handleChange}
                      required placeholder="03001234567"
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label>Address</label>
                  <div className="profile-input-wrapper">
                    <FaMapMarkerAlt className="profile-input-icon" />
                    <input
                      type="text" name="address"
                      value={form.address} onChange={handleChange}
                      placeholder="Karachi, Pakistan"
                    />
                  </div>
                </div>

                <div className="profile-form-actions">
                  <button
                    type="button" className="profile-cancel-btn"
                    onClick={handleCancel} disabled={loading}
                  >
                    <FaTimes /> Cancel
                  </button>
                  <button
                    type="submit" className="profile-save-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <><FaSpinner className="spin" /> Saving...</>
                    ) : (
                      <><FaSave /> Save Changes</>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <div className="profile-detail-row">
                  <div className="profile-detail-icon"><FaUser /></div>
                  <div className="profile-detail-info">
                    <span className="profile-detail-label">Full Name</span>
                    <span className="profile-detail-value">{user.name}</span>
                  </div>
                </div>

                <div className="profile-detail-row">
                  <div className="profile-detail-icon"><FaEnvelope /></div>
                  <div className="profile-detail-info">
                    <span className="profile-detail-label">Email Address</span>
                    <span className="profile-detail-value">{user.email}</span>
                  </div>
                </div>

                <div className="profile-detail-row">
                  <div className="profile-detail-icon"><FaPhone /></div>
                  <div className="profile-detail-info">
                    <span className="profile-detail-label">Phone Number</span>
                    <span className="profile-detail-value">{user.phone || 'Not provided'}</span>
                  </div>
                </div>

                <div className="profile-detail-row">
                  <div className="profile-detail-icon"><FaMapMarkerAlt /></div>
                  <div className="profile-detail-info">
                    <span className="profile-detail-label">Address</span>
                    <span className="profile-detail-value">{user.address || 'Not provided'}</span>
                  </div>
                </div>

                <div className="profile-detail-row">
                  <div className="profile-detail-icon"><FaCheckCircle /></div>
                  <div className="profile-detail-info">
                    <span className="profile-detail-label">Account Status</span>
                    <span className="profile-detail-value status-active">
                      <span className="status-dot" /> Active
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="profile-actions-card">
            <h3>Quick Actions</h3>
            <div className="profile-actions-grid">
              <Link to="/customer" className="profile-action-btn" style={{ textDecoration: 'none' }}>
                <FaTachometerAlt /> Customer Dashboard
              </Link>
              <Link to="/favorites" className="profile-action-btn" style={{ textDecoration: 'none' }}>
                <FaHeart /> My Favorites
              </Link>
              <Link to="/products" className="profile-action-btn" style={{ textDecoration: 'none' }}>
                <FaLeaf /> Browse Products
              </Link>
              <Link to="/" className="profile-action-btn" style={{ textDecoration: 'none' }}>
                <FaHome /> Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;