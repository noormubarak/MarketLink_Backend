import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ReviewsSection from '../components/ReviewsSection';
import FavoriteButton from '../components/FavoriteButton';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  FaStore, FaSearch, FaLeaf, FaMapMarkerAlt, FaPhone, FaUser,
  FaStar, FaCalendarAlt, FaClock, FaSpinner, FaTimes,
  FaShoppingBasket, FaTractor, FaEye, FaFilter,
  FaCheckCircle, FaBoxOpen
} from 'react-icons/fa';
import './Farmers.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest First' },
  { value: 'name', label: 'Stall Name (A-Z)' },
];

const Farmers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [farmers, setFarmers] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [sort, setSort] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmerProducts, setFarmerProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [toast, setToast] = useState({ show: false, text: '' });

  // Fetch markets for filter
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await api.get('/markets');
        setMarkets(res.data.data || []);
      } catch (err) {
        console.error('Failed to load markets:', err);
      }
    };
    fetchMarkets();
  }, []);

  // Fetch farmers
  const fetchFarmers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedMarket) params.market = selectedMarket;
      if (selectedDay) params.day = selectedDay;

      const res = await api.get('/farmers', { params });
      let data = res.data.data || [];

      if (searchInput.trim()) {
        const q = searchInput.toLowerCase();
        data = data.filter(
          (f) =>
            f.stallName?.toLowerCase().includes(q) ||
            f.contactPerson?.toLowerCase().includes(q) ||
            f.description?.toLowerCase().includes(q)
        );
      }

      if (sort === 'rating') {
        data = [...data].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sort === 'name') {
        data = [...data].sort((a, b) =>
          (a.stallName || '').localeCompare(b.stallName || '')
        );
      } else if (sort === 'newest') {
        data = [...data].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      }

      setFarmers(data);
    } catch (err) {
      console.error('Fetch farmers error:', err);
      setError('Failed to load farmers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedMarket, selectedDay, searchInput, sort]);

  useEffect(() => {
    const timer = setTimeout(fetchFarmers, 300);
    return () => clearTimeout(timer);
  }, [fetchFarmers]);

  // Open modal + fetch products
  const openFarmerModal = async (farmer) => {
    setSelectedFarmer(farmer);
    setFarmerProducts([]);
    setLoadingProducts(true);
    try {
      const res = await api.get(`/farmers/${farmer._id}/products`);
      setFarmerProducts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const closeModal = () => {
    setSelectedFarmer(null);
    setFarmerProducts([]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSelectedMarket('');
    setSelectedDay('');
    setSort('rating');
  };

  const hasFilters = searchInput || selectedMarket || selectedDay;
  const activeFilterCount = [searchInput, selectedMarket, selectedDay].filter(Boolean).length;

  // ============ HELPERS ============
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };

  const renderStars = (rating) => {
    const full = Math.round(rating || 0);
    return [...Array(5)].map((_, i) => (
      <FaStar key={i} className={i < full ? 'star filled' : 'star'} />
    ));
  };

  const isFarmerFavorited = (farmerId) => {
    if (!user?.favorites) return false;
    return user.favorites.some((id) => id.toString() === farmerId.toString());
  };

  // ============ ADD TO CART (from modal) ============
  const handleAddToCart = (product) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/farmers' } } });
      return;
    }
    if (user.role !== 'customer') {
      setToast({ show: true, text: 'Only customers can place orders.' });
      setTimeout(() => setToast({ show: false, text: '' }), 2500);
      return;
    }
    if (!product.isAvailable || product.stockQuantity <= 0) return;

    addToCart(product, 1);
    setToast({ show: true, text: `"${product.name}" added to cart!` });
    setTimeout(() => setToast({ show: false, text: '' }), 1800);
  };

  return (
    <div className="farmers-page">
      {/* HEADER */}
      <div className="farmers-header">
        <div className="farmers-header-content">
          <h1 className="farmers-title">
            <FaTractor className="farmers-title-icon" /> Meet Our Local Farmers
          </h1>
          <p className="farmers-subtitle">
            Discover passionate farmers growing fresh produce in your community
          </p>

          <div className="farmers-search-bar">
            <FaSearch className="farmers-search-icon" />
            <input
              type="text"
              placeholder="Search farmers by name or stall..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button className="farmers-search-clear" onClick={() => setSearchInput('')}>
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="farmers-toolbar">
        <button
          className="farmers-filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> Filters
          {activeFilterCount > 0 && (
            <span className="farmers-filter-badge">{activeFilterCount}</span>
          )}
        </button>

        <div className="farmers-count">
          {loading ? 'Loading...' : <>Showing <strong>{farmers.length}</strong> farmer{farmers.length !== 1 && 's'}</>}
        </div>

        <div className="farmers-sort">
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* FILTERS */}
      <div className={showFilters ? 'farmers-filters open' : 'farmers-filters'}>
        <div className="filters-grid">
          <div className="filter-col">
            <label>Market</label>
            <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)}>
              <option value="">All Markets</option>
              {markets.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-col">
            <label>Operating Day</label>
            <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
              <option value="">Any Day</option>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="filter-col filter-actions">
            {hasFilters && (
              <button className="farmers-clear-btn" onClick={clearFilters}>
                <FaTimes /> Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FARMERS GRID */}
      <div className="farmers-container">
        {loading ? (
          <div className="farmers-grid">
            {[...Array(6)].map((_, i) => (
              <div className="farmer-card skeleton" key={i}>
                <div className="skeleton-avatar" />
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="farmers-empty">
            <FaTractor className="empty-icon" />
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchFarmers}>Try Again</button>
          </div>
        ) : farmers.length === 0 ? (
          <div className="farmers-empty">
            <FaTractor className="empty-icon" />
            <h3>No farmers found</h3>
            <p>{hasFilters ? 'Try adjusting your filters.' : 'No farmers have registered yet.'}</p>
            {hasFilters && (
              <button className="retry-btn" onClick={clearFilters}>Clear Filters</button>
            )}
          </div>
        ) : (
          <div className="farmers-grid">
            {farmers.map((farmer) => {
              const favorited = isFarmerFavorited(farmer._id);
              return (
                <div
                  className="farmer-card"
                  key={farmer._id}
                  onClick={() => openFarmerModal(farmer)}
                >
                  {/* Banner */}
                  <div className="farmer-card-banner">
                    {/* Heart top-right */}
                    <div className="farmer-card-fav-wrapper">
                      <FavoriteButton
                        farmerId={farmer._id}
                        isFavorited={favorited}
                      />
                    </div>

                    {/* Avatar */}
                    <div className="farmer-avatar">
                      {farmer.imageUrl ? (
                        <img src={farmer.imageUrl} alt={farmer.stallName} />
                      ) : (
                        <span>{getInitials(farmer.stallName)}</span>
                      )}
                    </div>
                  </div>

                  <div className="farmer-card-body">
                    {/* Name + rating inline */}
                    <div className="farmer-name-row">
                      <h3 className="farmer-stall-name">{farmer.stallName}</h3>
                      {farmer.rating > 0 && (
                        <span className="farmer-rating-pill">
                          <FaStar /> {farmer.rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="farmer-contact">
                      <FaUser className="farmer-contact-icon" />
                      <span>{farmer.contactPerson}</span>
                    </div>

                    {farmer.location?.address && (
                      <div className="farmer-contact">
                        <FaMapMarkerAlt className="farmer-contact-icon" />
                        <span>{farmer.location.address}</span>
                      </div>
                    )}

                    {farmer.description && (
                      <p className="farmer-description">{farmer.description}</p>
                    )}

                    {farmer.operatingDays?.length > 0 && (
                      <div className="farmer-days">
                        {DAYS.map((day) => (
                          <span
                            key={day}
                            className={
                              farmer.operatingDays.includes(day)
                                ? 'farmer-day-pill active'
                                : 'farmer-day-pill'
                            }
                          >
                            {day.charAt(0)}
                          </span>
                        ))}
                      </div>
                    )}

                    <button className="farmer-view-btn">
                      <FaEye /> View Profile & Products
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============ FARMER DETAIL MODAL ============ */}
      {selectedFarmer && (
        <div className="farmer-modal-overlay" onClick={closeModal}>
          <div className="farmer-modal" onClick={(e) => e.stopPropagation()}>
            <button className="farmer-modal-close" onClick={closeModal}>
              <FaTimes />
            </button>

            {/* Modal header */}
            <div className="farmer-modal-header">
              <div className="farmer-modal-avatar">
                {selectedFarmer.imageUrl ? (
                  <img src={selectedFarmer.imageUrl} alt={selectedFarmer.stallName} />
                ) : (
                  <span>{getInitials(selectedFarmer.stallName)}</span>
                )}
              </div>

              <div className="farmer-modal-header-info">
                <h2>{selectedFarmer.stallName}</h2>
                <p className="farmer-modal-contact">
                  <FaUser /> {selectedFarmer.contactPerson}
                </p>
                {selectedFarmer.rating > 0 && (
                  <div className="farmer-modal-rating">
                    <div className="stars">{renderStars(selectedFarmer.rating)}</div>
                    <span>
                      {selectedFarmer.rating.toFixed(1)} ({selectedFarmer.totalReviews || 0} reviews)
                    </span>
                  </div>
                )}
              </div>

              <div className="farmer-modal-fav-wrapper">
                <FavoriteButton
                  farmerId={selectedFarmer._id}
                  isFavorited={isFarmerFavorited(selectedFarmer._id)}
                />
              </div>
            </div>

            {/* Modal body */}
            <div className="farmer-modal-body">
              {/* About */}
              {selectedFarmer.description && (
                <div className="farmer-modal-section">
                  <h3 className="farmer-modal-section-title">About</h3>
                  <p className="farmer-modal-desc">{selectedFarmer.description}</p>
                </div>
              )}

              {/* Location & Contact */}
              <div className="farmer-modal-section">
                <h3 className="farmer-modal-section-title">
                  <FaMapMarkerAlt /> Location & Contact
                </h3>
                <div className="farmer-modal-detail-grid">
                  {selectedFarmer.location?.address && (
                    <div className="farmer-modal-detail">
                      <FaMapMarkerAlt className="detail-icon" />
                      <div>
                        <span className="detail-label">Address</span>
                        <span className="detail-value">{selectedFarmer.location.address}</span>
                      </div>
                    </div>
                  )}
                  {selectedFarmer.userId?.phone && (
                    <div className="farmer-modal-detail">
                      <FaPhone className="detail-icon" />
                      <div>
                        <span className="detail-label">Phone</span>
                        <span className="detail-value">{selectedFarmer.userId.phone}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Operating Days */}
              {selectedFarmer.operatingDays?.length > 0 && (
                <div className="farmer-modal-section">
                  <h3 className="farmer-modal-section-title">
                    <FaCalendarAlt /> Operating Days
                  </h3>
                  <div className="farmer-modal-days">
                    {selectedFarmer.operatingDays.map((day) => (
                      <span key={day} className="farmer-modal-day active">{day}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pickup Windows */}
              {selectedFarmer.pickupWindows?.length > 0 && (
                <div className="farmer-modal-section">
                  <h3 className="farmer-modal-section-title">
                    <FaClock /> Pickup Windows
                  </h3>
                  <div className="farmer-modal-pickup">
                    {selectedFarmer.pickupWindows.map((w, i) => (
                      <div key={i} className="pickup-window-item">
                        <strong>{w.day}</strong>: {formatTime(w.startTime)} — {formatTime(w.endTime)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              <div className="farmer-modal-section">
                <h3 className="farmer-modal-section-title">
                  <FaShoppingBasket /> Products ({farmerProducts.length})
                </h3>

                {loadingProducts ? (
                  <div className="farmer-products-loading">
                    <FaSpinner className="spin" /> Loading products...
                  </div>
                ) : farmerProducts.length === 0 ? (
                  <div className="farmer-products-empty">
                    No products available right now.
                  </div>
                ) : (
                  <div className="farmer-products-list">
                    {farmerProducts.map((p) => {
                      const available = p.isAvailable && p.stockQuantity > 0;
                      return (
                        <div className="farmer-product-item" key={p._id}>
                          <div className="farmer-product-item-img">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} />
                            ) : (
                              <FaLeaf />
                            )}
                          </div>

                          <div className="farmer-product-item-info">
                            <div className="farmer-product-item-top">
                              <h4>{p.name}</h4>
                              <span className="farmer-product-item-cat">{p.category}</span>
                            </div>
                            {p.description && (
                              <p className="farmer-product-item-desc">{p.description}</p>
                            )}
                            <div className="farmer-product-item-bottom">
                              <div className="farmer-product-item-price">
                                <strong>Rs. {p.price}</strong>
                                <span>/ {p.unit}</span>
                              </div>
                              <span className={available ? 'farmer-product-item-stock in' : 'farmer-product-item-stock out'}>
                                {available ? `${p.stockQuantity} in stock` : 'Out of stock'}
                              </span>
                            </div>
                          </div>

                          <button
                            className="farmer-product-item-btn"
                            onClick={() => handleAddToCart(p)}
                            disabled={!available}
                          >
                            <FaShoppingBasket />
                            {available ? 'Add to Cart' : 'Unavailable'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reviews */}
              <div className="farmer-modal-section">
                <ReviewsSection
                  farmerId={selectedFarmer._id}
                  title={`Reviews for ${selectedFarmer.stallName}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast.show && (
        <div className="farmers-toast">
          <FaCheckCircle /> {toast.text}
        </div>
      )}
    </div>
  );
};

export default Farmers;