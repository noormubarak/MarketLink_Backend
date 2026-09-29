import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import WriteReviewModal from '../components/WriteReviewModal';
import {
  FaUser, FaHeart, FaShoppingBag, FaStar, FaLeaf, FaArrowRight,
  FaStore, FaBoxOpen, FaTruck, FaCheckCircle, FaClock,
  FaMapMarkerAlt, FaEdit, FaSpinner, FaTractor, FaPenFancy,
  FaHome
} from 'react-icons/fa';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const ordersRes = await api.get('/orders/my').catch(() => ({ data: { data: [] } }));
      setOrders(ordersRes.data.data || []);

      const favsRes = await api.get('/favorites').catch(() => ({ data: { data: [] } }));
      setFavorites(favsRes.data.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReviewSuccess = () => {
    setReviewSuccess('🎉 Review posted successfully!');
    fetchData();
    setTimeout(() => setReviewSuccess(''), 3000);
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) =>
    ['placed', 'accepted', 'ready'].includes(o.status)
  ).length;
  const completedOrders = orders.filter((o) => o.status === 'completed').length;

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const notificationReviewOrder = orders.find(
    (order) => order._id === location.state?.reviewOrderId && order.status === 'completed'
  );

  const closeReviewModal = () => {
    setReviewingOrder(null);
    if (location.state?.reviewOrderId) {
      navigate('/customer', { replace: true, state: null });
    }
  };

  const getInitials = (name) =>
    name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '?';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  const getStatusColor = (status) => {
    const colors = {
      placed: 'orange', accepted: 'blue', ready: 'purple',
      completed: 'green', declined: 'red', cancelled: 'red',
    };
    return colors[status] || 'gray';
  };

  return (
    <div className="cd-page">
      {/* HERO */}
      <div className="cd-hero">
        <div className="cd-hero-content">
          <div className="cd-hero-left">
            <div className="cd-avatar">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={user.name} />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <div className="cd-hero-text">
              <span className="cd-greeting">{getGreeting()},</span>
              <h1 className="cd-username">{user?.name}</h1>
              <p className="cd-hero-sub">Welcome back to your MarketLink dashboard</p>
            </div>
          </div>

          <div className="cd-hero-actions">
            <Link to="/" className="cd-home-btn">
              <FaHome /> Back to Home
            </Link>
            <button className="cd-edit-profile-btn" onClick={() => navigate('/profile')}>
              <FaEdit /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="cd-container">
        {reviewSuccess && (
          <div className="cd-success-banner">{reviewSuccess}</div>
        )}

        {/* STATS */}
        <div className="cd-stats-grid">
          <div className="cd-stat-card">
            <div className="cd-stat-icon green"><FaShoppingBag /></div>
            <div className="cd-stat-info">
              <span className="cd-stat-number">{totalOrders}</span>
              <span className="cd-stat-label">Total Orders</span>
            </div>
          </div>
          <div className="cd-stat-card">
            <div className="cd-stat-icon orange"><FaClock /></div>
            <div className="cd-stat-info">
              <span className="cd-stat-number">{pendingOrders}</span>
              <span className="cd-stat-label">Pending</span>
            </div>
          </div>
          <div className="cd-stat-card">
            <div className="cd-stat-icon purple"><FaHeart /></div>
            <div className="cd-stat-info">
              <span className="cd-stat-number">{favorites.length}</span>
              <span className="cd-stat-label">Favorites</span>
            </div>
          </div>
          <div className="cd-stat-card">
            <div className="cd-stat-icon blue"><FaCheckCircle /></div>
            <div className="cd-stat-info">
              <span className="cd-stat-number">{completedOrders}</span>
              <span className="cd-stat-label">Completed</span>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="cd-section">
          <h2 className="cd-section-title">Quick Actions</h2>
          <div className="cd-actions-grid">
            <Link to="/products" className="cd-action-card">
              <div className="cd-action-icon"><FaLeaf /></div>
              <div className="cd-action-info">
                <h3>Browse Products</h3>
                <p>Shop fresh from local farmers</p>
              </div>
              <FaArrowRight className="cd-action-arrow" />
            </Link>
            <Link to="/markets" className="cd-action-card">
              <div className="cd-action-icon"><FaStore /></div>
              <div className="cd-action-info">
                <h3>Find Markets</h3>
                <p>Discover markets near you</p>
              </div>
              <FaArrowRight className="cd-action-arrow" />
            </Link>
            <Link to="/farmers" className="cd-action-card">
              <div className="cd-action-icon"><FaTractor /></div>
              <div className="cd-action-info">
                <h3>Meet Farmers</h3>
                <p>Explore our local farmers</p>
              </div>
              <FaArrowRight className="cd-action-arrow" />
            </Link>
          </div>
        </div>

        {/* RECENT ORDERS */}
        <div className="cd-section">
          <div className="cd-section-header">
            <h2 className="cd-section-title">Recent Orders</h2>
          </div>

          {loading ? (
            <div className="cd-loading">
              <FaSpinner className="cd-spinner" />
              <p>Loading your orders...</p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="cd-empty-orders">
              <FaShoppingBag className="cd-empty-icon" />
              <h3>No orders yet</h3>
              <p>Start shopping from local farmers and place your first order!</p>
              <Link to="/products" className="cd-empty-btn">
                <FaLeaf /> Browse Products
              </Link>
            </div>
          ) : (
            <div className="cd-orders-list">
              {recentOrders.map((order) => (
                <div className="cd-order-row" key={order._id}>
                  <div className="cd-order-image">
                    {order.items?.[0]?.imageUrl ? (
                      <img src={order.items[0].imageUrl} alt={order.items[0].name} />
                    ) : (
                      <FaBoxOpen />
                    )}
                  </div>
                  <div className="cd-order-info">
                    <h4>
                      {order.items?.[0]?.name}
                      {order.items?.length > 1 && ` +${order.items.length - 1} more`}
                    </h4>
                    <span className="cd-order-meta">
                      Order #{order._id?.slice(-6).toUpperCase()} · {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="cd-order-right">
                    <span className={`cd-order-status status-${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="cd-order-amount">Rs. {order.totalAmount}</span>
                    {order.status === 'completed' && (
                      <button
                        className="cd-review-btn"
                        onClick={() => setReviewingOrder(order)}
                      >
                        <FaPenFancy /> Write Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAVORITE FARMERS */}
        {favorites.length > 0 && (
          <div className="cd-section">
            <div className="cd-section-header">
              <h2 className="cd-section-title">
                <FaHeart className="cd-section-icon" /> Favorite Farmers
              </h2>
              <Link to="/favorites" className="cd-view-all">
                View All <FaArrowRight />
              </Link>
            </div>
            <div className="cd-favorites-grid">
              {favorites.slice(0, 4).map((farmer) => (
                <div className="cd-favorite-card" key={farmer._id}>
                  <div className="cd-favorite-avatar">
                    {farmer.imageUrl ? (
                      <img src={farmer.imageUrl} alt={farmer.stallName} />
                    ) : (
                      getInitials(farmer.stallName)
                    )}
                  </div>
                  <h4>{farmer.stallName}</h4>
                  <p className="cd-favorite-location">
                    <FaMapMarkerAlt /> {farmer.location?.address || 'No address'}
                  </p>
                  {farmer.rating > 0 && (
                    <div className="cd-favorite-rating">
                      <FaStar /> {farmer.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {(reviewingOrder || notificationReviewOrder) && (
        <WriteReviewModal
          order={reviewingOrder || notificationReviewOrder}
          onClose={closeReviewModal}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;