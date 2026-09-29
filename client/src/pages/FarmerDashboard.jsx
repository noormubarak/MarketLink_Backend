import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../api/axios';
import {
  FaLeaf, FaBoxOpen, FaShoppingBag, FaMoneyBillWave, FaPlus,
  FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaSpinner, FaTimes,
  FaCheckCircle, FaTruck, FaClipboardList, FaChartLine, FaTrophy,
  FaUser, FaCloudUploadAlt, FaBell, FaSignOutAlt, FaCheck,
  FaStore, FaChevronDown, FaArrowUp, FaArrowDown, FaEye,
  FaFire, FaClock, FaMapMarkerAlt, FaWallet,
  FaBoxes, FaHourglassHalf, FaRegSmile, FaChartBar,
  FaStar, FaReply, FaQuoteLeft, FaImage
} from 'react-icons/fa';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import './Farmer.css';
import './FarmerDashboard.css';

const RevenueChartFrame = ({ children }) => {
  const frameRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 220 });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setDimensions({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="fd-chart-plot">
      {dimensions.width > 0 && React.cloneElement(children, dimensions)}
    </div>
  );
};

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const fileInputRef = useRef(null);
  const profileFileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [insights, setInsights] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [isProfileUploading, setIsProfileUploading] = useState(false);
  const [profileUploadError, setProfileUploadError] = useState('');

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', category: '', description: '', price: '',
    unit: 'kg', stockQuantity: '', imageUrl: '',
  });

  const [profileForm, setProfileForm] = useState({
    stallName: '', contactPerson: '', description: '',
    locationAddress: '', operatingDays: [], imageUrl: '',
  });

  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  // ============ FETCH DATA ============
  const fetchData = async () => {
    setLoading(true);
    try {
      const [insightsRes, ordersRes] = await Promise.all([
        api.get('/orders/farmer/insights'),
        api.get('/orders/farmer'),
      ]);
      setInsights(insightsRes.data.data);
      setOrders(ordersRes.data.data);

      const farmersRes = await api.get('/farmers');
      const myProfile = farmersRes.data.data.find(
        (f) => f.userId?._id === user?._id || f.userId === user?._id
      );
      if (myProfile) {
        setProfile(myProfile);
        const productsRes = await api.get('/products', {
          params: { farmerId: myProfile._id, limit: 100 },
        });
        setProducts(productsRes.data.data.items || []);
        setProfileForm({
          stallName: myProfile.stallName || '',
          contactPerson: myProfile.contactPerson || '',
          description: myProfile.description || '',
          locationAddress: myProfile.location?.address || '',
          operatingDays: myProfile.operatingDays || [],
          imageUrl: myProfile.imageUrl || '',
        });

        try {
          const reviewsRes = await api.get(`/reviews/farmer/${myProfile._id}`);
          setReviews(reviewsRes.data.data || []);
        } catch (e) {
          setReviews([]);
        }
      }
    } catch (err) {
      showMessage('error', 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.data || []);
      } catch (err) {}
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDropdown(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ============ HELPER: find product by name ============
  const findProductByName = (name) => {
    if (!name) return null;
    return products.find((p) => p.name?.toLowerCase() === name.toLowerCase()) || null;
  };

  // ============ HELPER: extract order from notification ============
  const findOrderFromNotification = (notif) => {
    if (!notif) return null;

    if (notif.link) {
      const match = notif.link.match(/\/orders\/([a-f0-9]{24})/i);
      if (match && match[1]) {
        const order = orders.find((o) => o._id === match[1]);
        if (order) return order;
      }
    }

    if (notif.message) {
      const shortMatch = notif.message.match(/#([a-f0-9]{6})/i);
      if (shortMatch && shortMatch[1]) {
        const order = orders.find((o) =>
          o._id.toLowerCase().endsWith(shortMatch[1].toLowerCase())
        );
        if (order) return order;
      }
    }

    return null;
  };

  // ============ HELPER: get notification image (order + review) ============
  const getNotifImage = (notif) => {
    const type = notif.type || '';

    // ============ ORDER NOTIFICATIONS ============
    if (type.startsWith('order_')) {
      const order = findOrderFromNotification(notif);
      if (!order || !order.items?.length) return null;

      const firstItem = order.items[0];
      const matchedProduct = findProductByName(firstItem.name);
      return firstItem.imageUrl || matchedProduct?.imageUrl || null;
    }

    // ============ REVIEW NOTIFICATIONS ============
    if (type.startsWith('review')) {
      // Strategy 1: try to extract review ID from link
      if (notif.link) {
        const match = notif.link.match(/\/reviews?\/([a-f0-9]{24})/i);
        if (match && match[1]) {
          const review = reviews.find((r) => r._id === match[1]);
          if (review?.productId) {
            const matchedProduct = products.find(
              (p) => p._id === review.productId?._id || p._id === review.productId
            );
            return review.productId?.imageUrl || matchedProduct?.imageUrl || null;
          }
        }
      }

      // Strategy 2: match by closest timestamp (review notifications are created right when the review posts)
      if (reviews.length > 0) {
        const notifTime = new Date(notif.createdAt).getTime();
        const closest = reviews.reduce((best, rev) => {
          const diff = Math.abs(new Date(rev.createdAt).getTime() - notifTime);
          return !best || diff < best.diff ? { review: rev, diff } : best;
        }, null);

        // Only use if within 5 minutes
        if (closest && closest.diff < 5 * 60 * 1000) {
          const review = closest.review;
          const matchedProduct = products.find(
            (p) => p._id === review.productId?._id || p._id === review.productId
          );
          return review.productId?.imageUrl || matchedProduct?.imageUrl || null;
        }
      }

      // Strategy 3: fall back to any recent review (last 10 minutes)
      const recentReview = reviews
        .filter((r) => {
          const diff = Math.abs(new Date(r.createdAt).getTime() - new Date(notif.createdAt).getTime());
          return diff < 10 * 60 * 1000;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      if (recentReview) {
        const matchedProduct = products.find(
          (p) => p._id === recentReview.productId?._id || p._id === recentReview.productId
        );
        return recentReview.productId?.imageUrl || matchedProduct?.imageUrl || null;
      }

      return null;
    }

    return null;
  };

  const getNotifIcon = (type) => {
    if (!type) return { icon: <FaLeaf />, color: 'green' };
    if (type.startsWith('order_')) {
      switch (type) {
        case 'order_placed': return { icon: <FaShoppingBag />, color: 'orange' };
        case 'order_accepted': return { icon: <FaCheck />, color: 'blue' };
        case 'order_ready': return { icon: <FaTruck />, color: 'purple' };
        case 'order_completed': return { icon: <FaCheckCircle />, color: 'green' };
        case 'order_declined':
        case 'order_cancelled': return { icon: <FaTimes />, color: 'red' };
      }
    }
    if (type.startsWith('review')) return { icon: <FaStar />, color: 'purple' };
    return { icon: <FaLeaf />, color: 'green' };
  };

  const getRelativeTime = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleNotifClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id);
    setShowNotifDropdown(false);

    const type = notif.type || '';
    if (type.startsWith('review')) { setActiveTab('reviews'); return; }
    if (type.startsWith('order_')) { setActiveTab('orders'); return; }
    setActiveTab('overview');
  };

  // ============ PRODUCT IMAGE UPLOAD ============
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setUploadError('Please select an image file.');
    if (file.size > 5 * 1024 * 1024) return setUploadError('Image must be smaller than 5MB');
    setUploadError('');
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProductForm((prev) => ({ ...prev, imageUrl: res.data.data.url }));
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setProductForm((prev) => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ============ PROFILE IMAGE UPLOAD ============
  const handleProfileImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setProfileUploadError('Please select an image file.');
    if (file.size > 5 * 1024 * 1024) return setProfileUploadError('Image must be smaller than 5MB');
    setProfileUploadError('');
    setIsProfileUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfileForm((prev) => ({ ...prev, imageUrl: res.data.data.url }));
    } catch (err) {
      setProfileUploadError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setIsProfileUploading(false);
    }
  };

  const handleRemoveProfileImage = () => {
    setProfileForm((prev) => ({ ...prev, imageUrl: '' }));
    if (profileFileInputRef.current) profileFileInputRef.current.value = '';
  };

  // ============ PRODUCT CRUD ============
  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: '', category: '', description: '', price: '', unit: 'kg', stockQuantity: '', imageUrl: '' });
    setUploadError('');
    setShowProductModal(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name, category: product.category,
      description: product.description || '', price: product.price,
      unit: product.unit, stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl || '',
    });
    setUploadError('');
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) return setUploadError('Please wait for the image to finish uploading.');
    setActionLoading('product');
    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        stockQuantity: Number(productForm.stockQuantity),
      };
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        showMessage('success', 'Product updated successfully!');
      } else {
        await api.post('/products', payload);
        showMessage('success', 'Product created successfully!');
      }
      setShowProductModal(false);
      fetchData();
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Operation failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setActionLoading(id);
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
      showMessage('success', 'Product deleted.');
    } catch (err) { showMessage('error', 'Delete failed.'); }
    finally { setActionLoading(null); }
  };

  const handleToggleAvailability = async (product) => {
    setActionLoading(product._id);
    try {
      const res = await api.patch(`/products/${product._id}/availability`, {
        isAvailable: !product.isAvailable,
      });
      setProducts(products.map((p) => (p._id === product._id ? res.data.data : p)));
      showMessage('success', product.isAvailable ? 'Product hidden from customers' : 'Product is now visible');
    } catch (err) { showMessage('error', 'Update failed.'); }
    finally { setActionLoading(null); }
  };

  const handleOrderStatus = async (orderId, status) => {
    setActionLoading(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      showMessage('success', `Order marked as ${status}.`);
      fetchData();
    } catch (err) { showMessage('error', 'Status update failed.'); }
    finally { setActionLoading(null); }
  };

  const handleReviewReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setActionLoading(reviewId);
    try {
      await api.post(`/reviews/${reviewId}/respond`, { farmerResponse: replyText.trim() });
      showMessage('success', 'Reply posted!');
      setReplyingTo(null);
      setReplyText('');
      fetchData();
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Reply failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (isProfileUploading) return setProfileUploadError('Please wait for the image to finish uploading.');
    setActionLoading('profile');
    try {
      const payload = {
        stallName: profileForm.stallName,
        contactPerson: profileForm.contactPerson,
        description: profileForm.description,
        imageUrl: profileForm.imageUrl,
        location: profileForm.locationAddress
          ? { address: profileForm.locationAddress, lat: profile?.location?.lat || 0, lng: profile?.location?.lng || 0 }
          : undefined,
      };
      await api.put('/farmers/profile', payload);
      showMessage('success', 'Profile updated!');
      fetchData();
    } catch (err) { showMessage('error', 'Profile update failed.'); }
    finally { setActionLoading(null); }
  };

  const pendingOrdersCount = orders.filter((o) => o.status === 'placed').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'completed').length;
  const activeProductsCount = products.filter((p) => p.isAvailable).length;
  const hiddenProductsCount = products.filter((p) => !p.isAvailable).length;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;
  const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    percent: reviews.length > 0
      ? Math.round((reviews.filter((r) => r.rating === stars).length / reviews.length) * 100)
      : 0,
  }));

  const getChartData = () => {
    const today = new Date();
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayOrders = completedOrders.filter(
        (o) => new Date(o.createdAt).toISOString().split('T')[0] === dateKey
      );
      data.push({
        day: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        revenue: dayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
      });
    }
    return data;
  };

  const chartData = getChartData();
  const chartTotal = chartData.reduce((s, d) => s + d.revenue, 0);

  const todayRevenue = chartData[chartData.length - 1]?.revenue || 0;
  const yesterdayRevenue = chartData[chartData.length - 2]?.revenue || 0;
  const revenueTrend = yesterdayRevenue > 0
    ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
    : 0;

  const getRecentActivity = () => {
    const items = [];
    orders.slice(0, 6).forEach((o) => {
      const firstItem = o.items?.[0];
      const matchedProduct = firstItem ? findProductByName(firstItem.name) : null;
      items.push({
        type: 'order',
        icon: <FaShoppingBag />,
        color: o.status === 'completed' ? 'green' : o.status === 'placed' ? 'orange' : 'blue',
        title: `Order #${o._id.slice(-6).toUpperCase()}`,
        subtitle: `${o.items?.length || 0} item${o.items?.length !== 1 ? 's' : ''} · Rs. ${o.totalAmount}`,
        time: o.createdAt,
        imageUrl: firstItem?.imageUrl || matchedProduct?.imageUrl || null,
      });
    });
    return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
  };

  const recentActivity = getRecentActivity();

  if (loading) {
    return (
      <div className="farmer-loading">
        <FaSpinner className="farmer-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="fd-page">
      <div className="fd-layout">
        <aside className="fd-sidebar" aria-label="Farmer dashboard navigation">
          <div className="fd-brand">
            <div className="fd-brand-logo"><FaLeaf /></div>
            <div className="fd-brand-text">
              <span className="fd-brand-name">MarketLink</span>
              <span className="fd-brand-tag">Farmer workspace</span>
            </div>
          </div>

          <nav className="fd-nav" aria-label="Dashboard sections">
            <button className={activeTab === 'overview' ? 'fd-nav-tab active' : 'fd-nav-tab'} onClick={() => setActiveTab('overview')}>
              <FaChartLine /><span>Overview</span>
            </button>
            <button className={activeTab === 'products' ? 'fd-nav-tab active' : 'fd-nav-tab'} onClick={() => setActiveTab('products')}>
              <FaBoxOpen /><span>Products</span>
              {products.length > 0 && <span className="fd-tab-count">{products.length}</span>}
            </button>
            <button className={activeTab === 'orders' ? 'fd-nav-tab active' : 'fd-nav-tab'} onClick={() => setActiveTab('orders')}>
              <FaShoppingBag /><span>Orders</span>
              {pendingOrdersCount > 0 && <span className="fd-tab-count urgent">{pendingOrdersCount}</span>}
            </button>
            <button className={activeTab === 'reviews' ? 'fd-nav-tab active' : 'fd-nav-tab'} onClick={() => setActiveTab('reviews')}>
              <FaStar /><span>Reviews</span>
              {reviews.length > 0 && <span className="fd-tab-count">{reviews.length}</span>}
            </button>
            <button className={activeTab === 'profile' ? 'fd-nav-tab active' : 'fd-nav-tab'} onClick={() => setActiveTab('profile')}>
              <FaUser /><span>Profile</span>
            </button>
          </nav>
        </aside>

        <div className="fd-content">
          {/* ============ HEADER ============ */}
          <header className="fd-header">
            <div className="fd-header-inner">
              {/* ✨ CHANGED: justifyContent changed to 'flex-end' to push everything to the right */}
              <div className="fd-header-actions" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', alignItems: 'center', gap: '16px' }}>
                
                {/* Left side buttons grouped together */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button className="fd-icon-btn" onClick={fetchData} title="Refresh">
                    <FaSpinner className={loading ? 'spin' : ''} />
                  </button>

                  <div className="fd-notif-wrapper" ref={notifRef}>
                    <button className="fd-icon-btn" onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
                      <FaBell />
                      {unreadCount > 0 && <span className="fd-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </button>

                    {showNotifDropdown && (
                      <div className="fd-notif-dropdown">
                        <div className="fd-notif-dropdown-head">
                          <h4>Notifications</h4>
                          {unreadCount > 0 && <button onClick={markAllAsRead}>Mark all read</button>}
                        </div>
                        <div className="fd-notif-dropdown-body">
                          {notifications.length === 0 ? (
                            <div className="fd-notif-empty">
                              <FaBell /><p>All caught up!</p><span>New orders will appear here</span>
                            </div>
                          ) : (
                            notifications.slice(0, 6).map((notif) => {
                              const { icon, color } = getNotifIcon(notif.type);
                              const productImage = getNotifImage(notif);

                              return (
                                <button
                                  key={notif._id}
                                  className={notif.isRead ? 'fd-notif-row' : 'fd-notif-row unread'}
                                  onClick={() => handleNotifClick(notif)}
                                >
                                  <div className={`fd-notif-row-icon notif-${color} ${productImage ? 'has-image' : ''}`}>
                                    {productImage ? (
                                      <img src={productImage} alt="" />
                                    ) : (
                                      icon
                                    )}
                                  </div>
                                  <div className="fd-notif-row-body">
                                    <p>{notif.message}</p>
                                    <span>{getRelativeTime(notif.createdAt)}</span>
                                  </div>
                                  {!notif.isRead && <span className="fd-notif-dot" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <div className="fd-notif-dropdown-foot">
                            <button onClick={() => { setShowNotifDropdown(false); setActiveTab('overview'); }}>Close</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side profile section */}
                <div className="fd-user-wrapper" ref={userMenuRef}>
                  <button className="fd-user-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                    <div className="fd-user-avatar">
                      {profile?.imageUrl ? (
                        <img src={profile.imageUrl} alt="" />
                      ) : (
                        user?.name?.charAt(0).toUpperCase() || 'F'
                      )}
                    </div>
                    <div className="fd-user-info">
                      <span className="fd-user-name">{user?.name?.split(' ')[0]}</span>
                      <span className="fd-user-role">{profile?.stallName || 'Farmer'}</span>
                    </div>
                    <FaChevronDown className={showUserMenu ? 'fd-user-chevron rotate' : 'fd-user-chevron'} />
                  </button>

                  {showUserMenu && (
                    <div className="fd-user-dropdown">
                      <div className="fd-user-dropdown-head">
                        <div className="fd-user-dropdown-avatar">
                          {profile?.imageUrl ? (
                            <img src={profile.imageUrl} alt="" />
                          ) : (
                            user?.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="fd-user-dropdown-meta">
                          <span className="fd-user-dropdown-name">{user?.name}</span>
                          <span className="fd-user-dropdown-email">{user?.email}</span>
                        </div>
                      </div>
                      <div className="fd-user-dropdown-divider" />
                      <button className="fd-user-dropdown-item" onClick={() => { setActiveTab('profile'); setShowUserMenu(false); }}>
                        <FaUser /> My Profile
                      </button>
                      <button className="fd-user-dropdown-item" onClick={() => { setActiveTab('products'); setShowUserMenu(false); }}>
                        <FaBoxOpen /> My Products
                      </button>
                      <button className="fd-user-dropdown-item" onClick={() => { setActiveTab('reviews'); setShowUserMenu(false); }}>
                        <FaStar /> My Reviews
                      </button>
                      <div className="fd-user-dropdown-divider" />
                      <button className="fd-user-dropdown-item danger" onClick={handleLogout}>
                        <FaSignOutAlt /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

      {/* ============ MAIN ============ */}
      <main className="fd-main">
        {message.text && (
          <div className={message.type === 'success' ? 'fd-alert success' : 'fd-alert error'}>
            {message.type === 'success' ? <FaCheckCircle /> : <FaTimes />}
            <span>{message.text}</span>
          </div>
        )}

        {/* ============ OVERVIEW ============ */}
        {activeTab === 'overview' && (
          <>
            <div className="fd-welcome">
              <div className="fd-welcome-left">
                <h1 className="fd-welcome-title">
                  Welcome back, {user?.name?.split(' ')[0]}! <FaRegSmile className="fd-welcome-emoji" />
                </h1>
                <p className="fd-welcome-sub">
                  Here's what's happening at <strong>{profile?.stallName || 'your stall'}</strong> today
                </p>
              </div>
              <button className="fd-primary-btn" onClick={openAddProduct}>
                <FaPlus /> Add Product
              </button>
            </div>

            <div className="fd-stats-grid">
              <div className="fd-stat-card green">
                <div className="fd-stat-icon"><FaShoppingBag /></div>
                <div className="fd-stat-body">
                  <span className="fd-stat-value">{insights?.totalOrders || 0}</span>
                  <span className="fd-stat-label">Total Orders</span>
                </div>
                <div className="fd-stat-trend up"><FaArrowUp /> All time</div>
              </div>

              <div className="fd-stat-card orange">
                <div className="fd-stat-icon"><FaHourglassHalf /></div>
                <div className="fd-stat-body">
                  <span className="fd-stat-value">{pendingOrdersCount}</span>
                  <span className="fd-stat-label">Pending</span>
                </div>
                {pendingOrdersCount > 0 && <div className="fd-stat-trend warning"><FaFire /> Action needed</div>}
              </div>

              <div className="fd-stat-card blue">
                <div className="fd-stat-icon"><FaWallet /></div>
                <div className="fd-stat-body">
                  <span className="fd-stat-value">Rs. {insights?.totalRevenue || 0}</span>
                  <span className="fd-stat-label">Total Revenue</span>
                </div>
                {revenueTrend !== 0 && (
                  <div className={revenueTrend > 0 ? 'fd-stat-trend up' : 'fd-stat-trend down'}>
                    {revenueTrend > 0 ? <FaArrowUp /> : <FaArrowDown />} {Math.abs(revenueTrend)}%
                  </div>
                )}
              </div>

              <div className="fd-stat-card purple">
                <div className="fd-stat-icon"><FaBoxes /></div>
                <div className="fd-stat-body">
                  <span className="fd-stat-value">{activeProductsCount}</span>
                  <span className="fd-stat-label">Active Products</span>
                </div>
                {hiddenProductsCount > 0 && (
                  <div className="fd-stat-trend muted"><FaEye /> {hiddenProductsCount} hidden</div>
                )}
              </div>
            </div>

            <div className="fd-overview-grid">
              <div className="fd-chart-card">
                <div className="fd-chart-header">
                  <div>
                    <h3 className="fd-chart-title"><FaChartBar /> Revenue</h3>
                    <p className="fd-chart-sub">Last 14 days</p>
                  </div>
                  <div className="fd-chart-total">
                    <span className="fd-chart-total-label">Total</span>
                    <span className="fd-chart-total-value">Rs. {chartTotal}</span>
                  </div>
                </div>
                <div className="fd-chart-body">
                  <RevenueChartFrame>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 5)} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'Outfit' }} formatter={(v) => [`Rs. ${v}`, 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#revenueGradient)" dot={{ r: 0 }} activeDot={{ r: 5, fill: '#16a34a', stroke: '#ffffff', strokeWidth: 2 }} />
                    </AreaChart>
                  </RevenueChartFrame>
                </div>
              </div>

              <div className="fd-activity-card">
                <div className="fd-activity-header">
                  <h3 className="fd-chart-title"><FaClock /> Recent Activity</h3>
                </div>
                <div className="fd-activity-body">
                  {recentActivity.length === 0 ? (
                    <div className="fd-activity-empty">
                      <FaClock /><p>No activity yet</p><span>Your recent orders will show here</span>
                    </div>
                  ) : (
                    recentActivity.map((item, i) => (
                      <div className="fd-activity-item" key={i}>
                        <div className={`fd-activity-img ${item.color}`}>
                          {item.imageUrl ? <img src={item.imageUrl} alt="" /> : item.icon}
                        </div>
                        <div className="fd-activity-info">
                          <span className="fd-activity-title">{item.title}</span>
                          <span className="fd-activity-sub">{item.subtitle}</span>
                        </div>
                        <span className="fd-activity-time">{getRelativeTime(item.time)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {pendingOrdersCount > 0 && (
              <div className="fd-alert-card">
                <div className="fd-alert-card-icon"><FaFire /></div>
                <div className="fd-alert-card-content">
                  <h3>{pendingOrdersCount} order{pendingOrdersCount > 1 ? 's' : ''} waiting for your response</h3>
                  <p>Accept or decline so customers can plan their pickup.</p>
                </div>
                <button className="fd-alert-card-btn" onClick={() => setActiveTab('orders')}>
                  View Orders <FaArrowUp style={{ transform: 'rotate(90deg)' }} />
                </button>
              </div>
            )}

            {insights?.topProducts?.length > 0 && (
              <div className="fd-section">
                <div className="fd-section-head">
                  <div>
                    <h2 className="fd-section-title"><FaTrophy /> Best Selling Products</h2>
                    <p className="fd-section-sub">Your top performers</p>
                  </div>
                </div>
                <div className="fd-bestsellers">
                  {insights.topProducts.map((p, i) => {
                    const fullProduct = findProductByName(p.name);
                    return (
                      <div className="fd-bestseller" key={p._id}>
                        <div className={`fd-bestseller-rank ${i < 3 ? `top-${i + 1}` : ''}`}>
                          #{i + 1}
                        </div>
                        <div className="fd-bestseller-img">
                          {fullProduct?.imageUrl ? (
                            <img src={fullProduct.imageUrl} alt={p.name} />
                          ) : (
                            <FaLeaf />
                          )}
                        </div>
                        <div className="fd-bestseller-info">
                          <span className="fd-bestseller-name">{p.name}</span>
                          <span className="fd-bestseller-sub">Best seller</span>
                        </div>
                        <div className="fd-bestseller-stats">
                          <span className="fd-bestseller-count">{p.sold}</span>
                          <span className="fd-bestseller-label">sold</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ============ PRODUCTS ============ */}
        {activeTab === 'products' && (
          <div className="fd-section">
            <div className="fd-section-head">
              <div>
                <h2 className="fd-section-title"><FaBoxOpen /> All Products</h2>
                <p className="fd-section-sub">
                  {products.length} product{products.length !== 1 ? 's' : ''} · {activeProductsCount} active · {hiddenProductsCount} hidden
                </p>
              </div>
              <button className="fd-primary-btn" onClick={openAddProduct}><FaPlus /> Add Product</button>
            </div>

            {products.length === 0 ? (
              <div className="fd-empty">
                <div className="fd-empty-icon"><FaBoxOpen /></div>
                <h3>No products yet</h3>
                <p>Add your first product to start selling to customers</p>
                <button className="fd-primary-btn" onClick={openAddProduct}><FaPlus /> Add Your First Product</button>
              </div>
            ) : (
              <div className="fd-products-grid">
                {products.map((p) => (
                  <div className={`fd-product-card ${!p.isAvailable ? 'hidden' : ''}`} key={p._id}>
                    <div className="fd-product-image">
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : <div className="fd-product-placeholder"><FaBoxOpen /></div>}
                      <div className={`fd-product-badge ${p.isAvailable ? 'visible' : 'hidden'}`}>
                        {p.isAvailable ? '● Visible' : '○ Hidden'}
                      </div>
                    </div>
                    <div className="fd-product-body">
                      <div className="fd-product-head">
                        <h3 className="fd-product-name">{p.name}</h3>
                        <span className="fd-product-cat">{p.category}</span>
                      </div>
                      <div className="fd-product-price-row">
                        <span className="fd-product-price">Rs. {p.price}</span>
                        <span className="fd-product-unit">per {p.unit}</span>
                      </div>
                      <div className="fd-product-stock-row">
                        <span className="fd-product-stock">
                          {p.stockQuantity > 0 ? (
                            <><span className="fd-stock-dot in-stock" /> {p.stockQuantity} in stock</>
                          ) : (
                            <><span className="fd-stock-dot out-stock" /> Out of stock</>
                          )}
                        </span>
                      </div>
                      <div className="fd-product-actions">
                        <button className={`fd-action-btn ${p.isAvailable ? 'toggle-on' : 'toggle-off'}`} onClick={() => handleToggleAvailability(p)} disabled={actionLoading === p._id}>
                          {p.isAvailable ? <FaToggleOn /> : <FaToggleOff />}
                          {p.isAvailable ? 'Active' : 'Hidden'}
                        </button>
                        <button className="fd-action-btn" onClick={() => openEditProduct(p)}><FaEdit /></button>
                        <button className="fd-action-btn danger" onClick={() => handleDeleteProduct(p._id)}><FaTrash /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ ORDERS ============ */}
        {activeTab === 'orders' && (
          <div className="fd-section">
            <div className="fd-section-head">
              <div>
                <h2 className="fd-section-title"><FaShoppingBag /> Incoming Orders</h2>
                <p className="fd-section-sub">
                  {orders.length} total · {pendingOrdersCount} pending · {completedOrdersCount} completed
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="fd-empty">
                <div className="fd-empty-icon"><FaShoppingBag /></div>
                <h3>No orders yet</h3>
                <p>Customer orders will appear here as soon as they're placed</p>
              </div>
            ) : (
              <div className="fd-orders-list">
                {orders.map((order) => (
                  <div className="fd-order-card" key={order._id}>
                    <div className="fd-order-header">
                      <div className="fd-order-id">
                        <span className="fd-order-hash">#</span>
                        {order._id.slice(-6).toUpperCase()}
                      </div>
                      <span className={`fd-order-status status-${order.status}`}>
                        {order.status === 'placed' && <><FaHourglassHalf /> New</>}
                        {order.status === 'accepted' && <><FaCheck /> Accepted</>}
                        {order.status === 'ready' && <><FaTruck /> Ready</>}
                        {order.status === 'completed' && <><FaCheckCircle /> Completed</>}
                        {order.status === 'declined' && <><FaTimes /> Declined</>}
                        {order.status === 'cancelled' && <><FaTimes /> Cancelled</>}
                      </span>
                    </div>

                    <div className="fd-order-customer">
                      <div className="fd-customer-avatar">
                        {order.customerId?.name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div className="fd-customer-info">
                        <span className="fd-customer-name">{order.customerId?.name}</span>
                        <span className="fd-customer-phone">{order.customerId?.phone}</span>
                      </div>
                    </div>

                    <div className="fd-order-items">
                      {order.items?.map((item, i) => {
                        const matchedProduct = findProductByName(item.name);
                        const img = item.imageUrl || matchedProduct?.imageUrl || '';
                        return (
                          <div className="fd-order-item" key={i}>
                            <div className="fd-order-item-img">
                              {img ? <img src={img} alt={item.name} /> : <FaLeaf />}
                            </div>
                            <span className="fd-order-item-qty">{item.quantity}×</span>
                            <span className="fd-order-item-name">{item.name}</span>
                            <span className="fd-order-item-price">Rs. {item.price * item.quantity}</span>
                          </div>
                        );
                      })}
                    </div>

                    {order.notes?.trim() && (
                      <div className="fd-order-notes">
                        <strong>Customer note</strong>
                        <p>{order.notes}</p>
                      </div>
                    )}

                    <div className="fd-order-foot">
                      <div className="fd-order-total">
                        <span>Total</span>
                        <strong>Rs. {order.totalAmount}</strong>
                      </div>
                      <div className="fd-order-actions">
                        {order.status === 'placed' && (
                          <>
                            <button className="fd-btn-danger" onClick={() => handleOrderStatus(order._id, 'declined')} disabled={actionLoading === order._id}><FaTimes /> Decline</button>
                            <button className="fd-btn-primary" onClick={() => handleOrderStatus(order._id, 'accepted')} disabled={actionLoading === order._id}><FaCheckCircle /> Accept</button>
                          </>
                        )}
                        {order.status === 'accepted' && (
                          <button className="fd-btn-primary" onClick={() => handleOrderStatus(order._id, 'ready')} disabled={actionLoading === order._id}><FaTruck /> Mark Ready</button>
                        )}
                        {order.status === 'ready' && (
                          <button className="fd-btn-success" onClick={() => handleOrderStatus(order._id, 'completed')} disabled={actionLoading === order._id}><FaCheckCircle /> Complete</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ REVIEWS ============ */}
        {activeTab === 'reviews' && (
          <div className="fd-section">
            <div className="fd-section-head">
              <div>
                <h2 className="fd-section-title"><FaStar /> Customer Reviews</h2>
                <p className="fd-section-sub">
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''} on your stall
                </p>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="fd-empty">
                <div className="fd-empty-icon"><FaStar /></div>
                <h3>No reviews yet</h3>
                <p>Reviews from customers will appear here after they receive their orders</p>
              </div>
            ) : (
              <div className="fd-reviews-layout">
                <aside className="fd-reviews-summary">
                  <div className="fd-summary-card">
                    <div className="fd-summary-rating">
                      <span className="fd-summary-number">{avgRating}</span>
                      <div className="fd-summary-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <FaStar key={s} className={s <= Math.round(avgRating) ? 'fd-star active' : 'fd-star'} />
                        ))}
                      </div>
                      <span className="fd-summary-count">
                        {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="fd-summary-breakdown">
                      {ratingBreakdown.map((r) => (
                        <div className="fd-breakdown-row" key={r.stars}>
                          <span className="fd-breakdown-label">{r.stars} <FaStar /></span>
                          <div className="fd-breakdown-bar">
                            <div className="fd-breakdown-fill" style={{ width: `${r.percent}%` }} />
                          </div>
                          <span className="fd-breakdown-count">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>

                <div className="fd-reviews-list">
                  {reviews.map((review) => (
                    <div className="fd-review-card" key={review._id}>
                      <div className="fd-review-header">
                        <div className="fd-review-author">
                          <div className="fd-review-avatar">
                            {review.customerId?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="fd-review-author-info">
                            <span className="fd-review-author-name">{review.customerId?.name || 'Anonymous'}</span>
                            <span className="fd-review-date">
                              {new Date(review.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className="fd-review-stars">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <FaStar key={s} className={s <= review.rating ? 'fd-star active' : 'fd-star'} />
                          ))}
                        </div>
                      </div>

                      {review.productId?.name && (
                        <div className="fd-review-product"><FaBoxOpen /> {review.productId.name}</div>
                      )}

                      {review.comment && (
                        <div className="fd-review-comment">
                          <FaQuoteLeft className="fd-review-quote" />
                          <p>{review.comment}</p>
                        </div>
                      )}

                      {review.farmerResponse ? (
                        <div className="fd-review-response">
                          <div className="fd-review-response-header"><FaReply /> <strong>Your Response</strong></div>
                          <p>{review.farmerResponse}</p>
                        </div>
                      ) : (
                        <>
                          {replyingTo === review._id ? (
                            <div className="fd-reply-form">
                              <textarea
                                rows="2"
                                placeholder="Thank your customer or address their feedback..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                maxLength={500}
                              />
                              <div className="fd-reply-actions">
                                <button className="fd-reply-cancel" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</button>
                                <button className="fd-reply-submit" onClick={() => handleReviewReply(review._id)} disabled={actionLoading === review._id || !replyText.trim()}>
                                  {actionLoading === review._id ? <FaSpinner className="spin" /> : <FaReply />} Post Reply
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button className="fd-reply-btn" onClick={() => { setReplyingTo(review._id); setReplyText(''); }}>
                              <FaReply /> Reply to review
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ PROFILE ============ */}
        {activeTab === 'profile' && (
          <div className="fd-section">
            <div className="fd-section-head">
              <div>
                <h2 className="fd-section-title"><FaStore /> Stall Profile</h2>
                <p className="fd-section-sub">This is how customers see your stall</p>
              </div>
            </div>

            <div className="fd-profile-layout">
              <aside className="fd-profile-preview">
                <div className="fd-preview-card">
                  <button
                    type="button"
                    className="fd-preview-avatar fd-preview-avatar-clickable"
                    onClick={() => !isProfileUploading && profileFileInputRef.current?.click()}
                    disabled={isProfileUploading}
                    title="Click to upload stall photo"
                  >
                    {profileForm.imageUrl ? (
                      <img src={profileForm.imageUrl} alt={profileForm.stallName} />
                    ) : (
                      <span className="fd-preview-avatar-initial">
                        {profile?.stallName?.charAt(0).toUpperCase() || 'F'}
                      </span>
                    )}

                    <span className="fd-preview-avatar-overlay">
                      {isProfileUploading ? (
                        <FaSpinner className="spin" />
                      ) : (
                        <>
                          <FaCloudUploadAlt />
                          <span>Upload</span>
                        </>
                      )}
                    </span>
                  </button>

                  <h3 className="fd-preview-name">{profileForm.stallName || 'Your Stall'}</h3>
                  <p className="fd-preview-person">{profileForm.contactPerson || 'Contact person'}</p>
                  {profileForm.locationAddress && (
                    <p className="fd-preview-location"><FaMapMarkerAlt /> {profileForm.locationAddress}</p>
                  )}
                  {profileForm.operatingDays?.length > 0 && (
                    <div className="fd-preview-days">
                      {profileForm.operatingDays.map((d) => (
                        <span key={d} className="fd-preview-day">{d}</span>
                      ))}
                    </div>
                  )}

                  {profileForm.imageUrl && (
                    <button
                      type="button"
                      className="fd-preview-remove-photo"
                      onClick={handleRemoveProfileImage}
                      disabled={isProfileUploading}
                    >
                      <FaTimes /> Remove Photo
                    </button>
                  )}
                </div>
              </aside>

              <form className="fd-profile-form" onSubmit={handleProfileUpdate}>
                <input
                  ref={profileFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageSelect}
                  style={{ display: 'none' }}
                />
                {profileUploadError && (
                  <div className="fd-alert error">
                    <FaTimes /> <span>{profileUploadError}</span>
                  </div>
                )}

                <div className="fd-form-row">
                  <div className="fd-form-group">
                    <label>Stall Name</label>
                    <input type="text" value={profileForm.stallName} onChange={(e) => setProfileForm({ ...profileForm, stallName: e.target.value })} required />
                  </div>
                  <div className="fd-form-group">
                    <label>Contact Person</label>
                    <input type="text" value={profileForm.contactPerson} onChange={(e) => setProfileForm({ ...profileForm, contactPerson: e.target.value })} required />
                  </div>
                </div>

                <div className="fd-form-group">
                  <label>Description</label>
                  <textarea rows="3" value={profileForm.description} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} placeholder="Tell customers about your stall..." />
                </div>

                <div className="fd-form-group">
                  <label>Pickup Address</label>
                  <input type="text" value={profileForm.locationAddress} onChange={(e) => setProfileForm({ ...profileForm, locationAddress: e.target.value })} placeholder="e.g., Empress Market, Karachi" />
                </div>

                {profileForm.operatingDays?.length > 0 && (
                  <div className="fd-info-banner">
                    <FaClock className="fd-info-banner-icon" />
                    <div>
                      <strong>Operating Days: {profileForm.operatingDays.join(', ')}</strong>
                      <p>These are set automatically based on the markets you selected during signup.</p>
                    </div>
                  </div>
                )}

                <div className="fd-form-actions">
                  <button type="submit" className="fd-primary-btn" disabled={actionLoading === 'profile' || isProfileUploading}>
                    {actionLoading === 'profile' ? (
                      <><FaSpinner className="spin" /> Saving...</>
                    ) : isProfileUploading ? (
                      <><FaSpinner className="spin" /> Uploading image...</>
                    ) : (
                      <><FaCheck /> Save Changes</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ============ PRODUCT MODAL ============ */}
      {showProductModal && (
        <div className="farmer-modal-overlay" onClick={() => !isUploading && setShowProductModal(false)}>
          <div className="farmer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="farmer-modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="farmer-modal-close" onClick={() => !isUploading && setShowProductModal(false)} disabled={isUploading}><FaTimes /></button>
            </div>
            <form onSubmit={handleProductSubmit} className="farmer-modal-form">
              <div className="farmer-form-group">
                <label>Product Image</label>
                {productForm.imageUrl ? (
                  <div className="farmer-image-preview">
                    <img src={productForm.imageUrl} alt="Preview" />
                    <button type="button" className="farmer-image-remove" onClick={handleRemoveImage} disabled={isUploading}><FaTimes /> Remove</button>
                  </div>
                ) : (
                  <div className={`farmer-upload-area ${isUploading ? 'uploading' : ''}`} onClick={() => !isUploading && fileInputRef.current?.click()}>
                    {isUploading ? (
                      <><FaSpinner className="farmer-upload-spinner" /><p className="farmer-upload-text">Uploading...</p></>
                    ) : (
                      <><FaCloudUploadAlt className="farmer-upload-icon" /><p className="farmer-upload-text">Click to upload image</p><p className="farmer-upload-hint">JPG, PNG · Max 5MB</p></>
                    )}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                {uploadError && <p className="farmer-upload-error">{uploadError}</p>}
              </div>

              <div className="farmer-form-group">
                <label>Product Name</label>
                <input type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
              </div>

              <div className="farmer-form-row">
                <div className="farmer-form-group">
                  <label>Category</label>
                  <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} required>
                    <option value="">Select...</option>
                    {categories.map((cat) => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="farmer-form-group">
                  <label>Unit</label>
                  <select value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} required>
                    <option value="kg">kg</option>
                    <option value="dozen">dozen</option>
                    <option value="piece">piece</option>
                    <option value="litre">litre</option>
                    <option value="bunch">bunch</option>
                  </select>
                </div>
              </div>

              <div className="farmer-form-row">
                <div className="farmer-form-group">
                  <label>Price (Rs.)</label>
                  <input type="number" min="0" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required />
                </div>
                <div className="farmer-form-group">
                  <label>Stock Quantity</label>
                  <input type="number" min="0" value={productForm.stockQuantity} onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })} required />
                </div>
              </div>

              <div className="farmer-form-group">
                <label>Description</label>
                <textarea rows="3" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="Describe your product..." />
              </div>

              <div className="farmer-modal-actions">
                <button type="button" className="farmer-btn-cancel" onClick={() => setShowProductModal(false)} disabled={isUploading}>Cancel</button>
                <button type="submit" className="farmer-btn-primary" disabled={actionLoading === 'product' || isUploading}>
                  {actionLoading === 'product' ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;