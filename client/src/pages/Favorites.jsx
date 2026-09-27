import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  FaHeart, FaLeaf, FaSpinner, FaMapMarkerAlt, FaStar,
  FaTractor, FaArrowRight, FaUser
} from 'react-icons/fa';
import './Favorites.css';

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ============ FETCH FAVORITES ============
  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/favorites');
        setFavorites(res.data.data || []);
      } catch (err) {
        console.error('Fetch favorites error:', err);
        setError('Failed to load your favorites. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [user]);

  // ============ HELPERS ============
  const getInitials = (name) =>
    name
      ? name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : '?';

  // ============ RENDER ============
  if (!user) {
    return (
      <div className="fav-page">
        <div className="fav-empty">
          <FaHeart className="fav-empty-icon" />
          <h2>Please log in to view your favorites</h2>
          <button className="fav-empty-btn" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fav-page">
      {/* ============ HEADER ============ */}
      <div className="fav-header">
        <h1 className="fav-title">
          <FaHeart className="fav-title-icon" /> My Favorite Farmers
        </h1>
        <p className="fav-subtitle">
          Your saved stalls from local farmers you love
        </p>
      </div>

      <div className="fav-container">
        {loading ? (
          <div className="fav-loading">
            <FaSpinner className="fav-spinner" />
            <p>Loading your favorites...</p>
          </div>
        ) : error ? (
          <div className="fav-error">
            <FaTractor className="fav-error-icon" />
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="fav-retry-btn" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        ) : favorites.length === 0 ? (
          <div className="fav-empty">
            <FaHeart className="fav-empty-icon" />
            <h3>No favorites yet</h3>
            <p>
              Browse our farmers and tap the heart icon to save your favorite stalls.
            </p>
            <Link to="/farmers" className="fav-empty-btn">
              <FaTractor /> Explore Farmers
            </Link>
          </div>
        ) : (
          <div className="fav-grid">
            {favorites.map((farmer) => (
              <div className="fav-card" key={farmer._id}>
                <div className="fav-card-avatar">
                  {farmer.imageUrl ? (
                    <img src={farmer.imageUrl} alt={farmer.stallName} />
                  ) : (
                    <span>{getInitials(farmer.stallName)}</span>
                  )}
                </div>

                <div className="fav-card-info">
                  <h3 className="fav-stall-name">{farmer.stallName}</h3>

                  <div className="fav-detail-row">
                    <FaUser className="fav-detail-icon" />
                    <span>{farmer.contactPerson}</span>
                  </div>

                  {farmer.location?.address && (
                    <div className="fav-detail-row">
                      <FaMapMarkerAlt className="fav-detail-icon" />
                      <span>{farmer.location.address}</span>
                    </div>
                  )}

                  {farmer.rating > 0 && (
                    <div className="fav-rating">
                      <FaStar /> {farmer.rating.toFixed(1)} ({farmer.totalReviews || 0})
                    </div>
                  )}

                  <Link to={`/farmers`} className="fav-view-btn">
                    <FaArrowRight /> View Stall
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;