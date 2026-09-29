import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  FaUsers, FaStore, FaShoppingBag, FaTractor,
  FaCheckCircle, FaBan, FaSpinner, FaSyncAlt,
  FaSignOutAlt, FaChevronDown,
  FaLeaf, FaChartLine, FaMoneyBillWave, FaTrophy,
  FaPlus, FaEdit, FaTrash, FaTimes, FaMapMarkerAlt,
  FaClock, FaCalendarAlt, FaListAlt, FaUserSlash, FaUserCheck, FaEnvelope,
  FaStar, FaCommentSlash, FaFilter, FaBox, FaTag, FaBoxOpen,
  FaImage, FaToggleOn, FaToggleOff
} from 'react-icons/fa';
import {
  Area, AreaChart, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Label, BarChart, Bar, Legend
} from 'recharts';
import './Admin.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const { revenue = 0, orders = 0 } = payload[0].payload;

  return (
    <div className="admin-chart-tooltip">
      <span>{label}</span>
      <strong>Rs. {Number(revenue).toLocaleString()}</strong>
      <small>{orders} completed {orders === 1 ? 'order' : 'orders'}</small>
    </div>
  );
};

const ChartFrame = ({ children }) => {
  const frameRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 260 });

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
    <div ref={frameRef} className="admin-chart-frame">
      {dimensions.width > 0 && React.cloneElement(children, dimensions)}
    </div>
  );
};

const AdminSidebar = ({ activeTab, setActiveTab, counts }) => {
  const items = [
    { id: 'overview', label: 'Overview', icon: FaChartLine },
    { id: 'customers', label: 'Customers', count: counts.customers, icon: FaUsers },
    { id: 'markets', label: 'Markets', count: counts.markets, icon: FaStore },
    { id: 'products', label: 'Products', count: counts.products, icon: FaBox },
    { id: 'categories', label: 'Categories', count: counts.categories, icon: FaTag },
    { id: 'reviews', label: 'Reviews', count: counts.reviews, icon: FaStar },
    { id: 'contact', label: 'Contact Messages', count: counts.contact, icon: FaEnvelope },
  ];

  return (
    <aside className="admin-sidebar" aria-label="Admin navigation">
      <div className="admin-sidebar-brand">
        <span className="admin-sidebar-brand-icon"><FaLeaf /></span>
        <span className="admin-sidebar-brand-copy">
          <strong>MarketLink</strong>
          <small>Admin workspace</small>
        </span>
      </div>
      <div className="admin-sidebar-heading">Workspace</div>
      <nav className="admin-sidebar-nav" role="tablist" aria-label="Dashboard sections">
        {items.map(({ id, label, count, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={activeTab === id ? 'admin-sidebar-link active' : 'admin-sidebar-link'}
            onClick={() => setActiveTab(id)}
          >
            <Icon />
            <span>{label}</span>
            {count !== undefined && <span className="admin-sidebar-count">{count}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdminProfile, setShowAdminProfile] = useState(false);

  // Data
  const [stats, setStats] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [chartRange, setChartRange] = useState(14);
  const [pendingFarmers, setPendingFarmers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [reports, setReports] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [reviewFilter, setReviewFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');

  // Market modal
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [editingMarket, setEditingMarket] = useState(null);
  const [marketForm, setMarketForm] = useState({
    name: '', address: '', lat: '', lng: '',
    operatingDays: [], openTime: '06:00', closeTime: '14:00',
  });

  // ✨ Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryImageUploading, setCategoryImageUploading] = useState(false);
  const [categoryImageError, setCategoryImageError] = useState('');
  const categoryFileInputRef = useRef(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '', imageUrl: '', isActive: true,
  });

  // ============ FETCH ALL DATA ============
  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        statsRes, pendingRes, reportsRes, marketsRes,
        custRes, revRes, prodRes, analyticsRes, catRes, contactRes
      ] = await Promise.all([
        api.get('/admin/dashboard').catch(() => ({ data: { data: null } })),
        api.get('/admin/farmers/pending').catch(() => ({ data: { data: [] } })),
        api.get('/admin/reports').catch(() => ({ data: { data: null } })),
        api.get('/markets').catch(() => ({ data: { data: [] } })),
        api.get('/admin/customers').catch(() => ({ data: { data: [] } })),
        api.get('/admin/reviews').catch(() => ({ data: { data: [] } })),
        api.get('/admin/products').catch(() => ({ data: { data: [] } })),
        api.get('/admin/analytics').catch(() => ({ data: { data: null } })),
        api.get('/admin/categories').catch(() => ({ data: { data: [] } })),
        api.get('/contact').catch(() => ({ data: { data: [] } })),
      ]);
      setStats(statsRes.data.data);
      setPendingFarmers(pendingRes.data.data);
      setReports(reportsRes.data.data);
      setMarkets(marketsRes.data.data);
      setAllCustomers(custRes.data.data);
      setAllReviews(revRes.data.data);
      setAllProducts(prodRes.data.data);
      setAnalyticsData(analyticsRes.data.data);
      setCategories(catRes.data.data);
      setContactMessages(contactRes.data.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      showMessage('error', 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3500);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const revenueChartData = (analyticsData?.revenueChart || []).slice(-chartRange);
  const userGrowthData = (analyticsData?.userGrowth || []).slice(-chartRange);
  const orderStatusTotal = (analyticsData?.statusChart || []).reduce((total, status) => total + status.value, 0);
  const renderChartRange = () => (
    <div className="admin-chart-range" role="group" aria-label="Chart date range">
      {[7, 14].map((range) => (
        <button
          key={range}
          type="button"
          className={chartRange === range ? 'active' : ''}
          aria-pressed={chartRange === range}
          onClick={() => setChartRange(range)}
        >
          {range} days
        </button>
      ))}
    </div>
  );

  // ============ FARMER ACTIONS ============
  const handleApprove = async (farmerId) => {
    setActionLoading(farmerId);
    try {
      await api.patch(`/admin/farmers/${farmerId}/approve`);
      showMessage('success', '✅ Farmer approved!');
      setPendingFarmers(pendingFarmers.filter((f) => f._id !== farmerId));
      const statsRes = await api.get('/admin/dashboard');
      setStats(statsRes.data.data);
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Approval failed.');
    } finally { setActionLoading(null); }
  };

  const handleSuspend = async (farmerId) => {
    if (!window.confirm('Suspend this farmer?')) return;
    setActionLoading(farmerId);
    try {
      await api.patch(`/admin/farmers/${farmerId}/suspend`);
      showMessage('success', 'Farmer suspended.');
      setPendingFarmers(pendingFarmers.filter((f) => f._id !== farmerId));
    } catch (err) {
      showMessage('error', 'Suspend failed.');
    } finally { setActionLoading(null); }
  };

  // ============ CUSTOMER ACTIONS ============
  const toggleCustomerStatus = async (customer) => {
    if (!window.confirm(`${customer.isActive ? 'Deactivate' : 'Activate'} ${customer.name}?`)) return;
    setActionLoading(customer._id);
    try {
      await api.patch(`/admin/customers/${customer._id}/status`, { isActive: !customer.isActive });
      setAllCustomers(allCustomers.map((c) =>
        c._id === customer._id ? { ...c, isActive: !c.isActive } : c
      ));
      showMessage('success', 'Status updated.');
    } catch (err) { showMessage('error', 'Action failed.'); }
    finally { setActionLoading(null); }
  };

  // ============ PRODUCT MODERATION ============
  const handleRemoveProduct = async (productId) => {
    if (!window.confirm('Remove this product from the platform?')) return;
    setActionLoading(productId);
    try {
      await api.delete(`/admin/products/${productId}`);
      setAllProducts(allProducts.filter((p) => p._id !== productId));
      showMessage('success', 'Product removed.');
    } catch (err) { showMessage('error', 'Delete failed.'); }
    finally { setActionLoading(null); }
  };

  // ============ REVIEW MODERATION ============
  const handleRemoveReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    setActionLoading(reviewId);
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      setAllReviews(allReviews.filter((r) => r._id !== reviewId));
      showMessage('success', 'Review deleted.');
    } catch (err) { showMessage('error', 'Delete failed.'); }
    finally { setActionLoading(null); }
  };

  // ============ MARKET CRUD ============
  const openAddMarket = () => {
    setEditingMarket(null);
    setMarketForm({ name: '', address: '', lat: '', lng: '', operatingDays: [], openTime: '06:00', closeTime: '14:00' });
    setShowMarketModal(true);
  };

  const openEditMarket = (market) => {
    setEditingMarket(market);
    setMarketForm({
      name: market.name || '',
      address: market.address || '',
      lat: market.lat ?? '',
      lng: market.lng ?? '',
      operatingDays: market.operatingDays || [],
      openTime: market.timings?.open || '06:00',
      closeTime: market.timings?.close || '14:00',
    });
    setShowMarketModal(true);
  };

  const toggleMarketDay = (day) => {
    setMarketForm((prev) => ({
      ...prev,
      operatingDays: prev.operatingDays.includes(day)
        ? prev.operatingDays.filter((d) => d !== day)
        : [...prev.operatingDays, day],
    }));
  };

  const handleMarketSubmit = async (e) => {
    e.preventDefault();
    if (marketForm.operatingDays.length === 0) return showMessage('error', 'Select at least one day.');
    if (!marketForm.lat || !marketForm.lng) return showMessage('error', 'Lat and Lng required.');

    setActionLoading('market');
    const payload = {
      name: marketForm.name.trim(),
      address: marketForm.address.trim(),
      lat: Number(marketForm.lat),
      lng: Number(marketForm.lng),
      operatingDays: marketForm.operatingDays,
      timings: { open: marketForm.openTime, close: marketForm.closeTime },
      location: { type: 'Point', coordinates: [Number(marketForm.lng), Number(marketForm.lat)] },
    };

    try {
      if (editingMarket) {
        await api.put(`/admin/markets/${editingMarket._id}`, payload);
        showMessage('success', '✅ Market updated!');
      } else {
        await api.post('/admin/markets', payload);
        showMessage('success', '✅ Market created!');
      }
      setShowMarketModal(false);
      fetchData();
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Operation failed.');
    } finally { setActionLoading(null); }
  };

  const handleDeleteMarket = async (id) => {
    if (!window.confirm('Delete this market?')) return;
    setActionLoading(id);
    try {
      await api.delete(`/admin/markets/${id}`);
      setMarkets(markets.filter((m) => m._id !== id));
      showMessage('success', 'Market deleted.');
    } catch (err) { showMessage('error', 'Delete failed.'); }
    finally { setActionLoading(null); }
  };

  // ============ ✨ CATEGORY CRUD ============
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', imageUrl: '', isActive: true });
    setCategoryImageError('');
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || '',
      imageUrl: cat.imageUrl || '',
      isActive: cat.isActive !== false,
    });
    setCategoryImageError('');
    setShowCategoryModal(true);
  };

  const handleCategoryImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setCategoryImageError('Choose an image file.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCategoryImageError('Image must be smaller than 5MB.');
      event.target.value = '';
      return;
    }

    setCategoryImageError('');
    setCategoryImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCategoryForm((prev) => ({ ...prev, imageUrl: res.data.data.url }));
    } catch (err) {
      setCategoryImageError(err.response?.data?.error || 'Image upload failed.');
    } finally {
      setCategoryImageUploading(false);
      event.target.value = '';
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return showMessage('error', 'Category name is required.');
    if (categoryImageUploading) return;

    setActionLoading('category');
    const payload = {
      name: categoryForm.name.trim(),
      imageUrl: categoryForm.imageUrl.trim(),
      isActive: categoryForm.isActive,
    };

    try {
      if (editingCategory) {
        const res = await api.put(`/admin/categories/${editingCategory._id}`, payload);
        setCategories(categories.map((c) => (c._id === editingCategory._id ? res.data.data : c)));
        showMessage('success', '✅ Category updated!');
      } else {
        const res = await api.post('/admin/categories', payload);
        setCategories([res.data.data, ...categories]);
        showMessage('success', '✅ Category created!');
      }
      setShowCategoryModal(false);
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Operation failed.');
    } finally { setActionLoading(null); }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Products using it may become uncategorized.')) return;
    setActionLoading(id);
    try {
      await api.delete(`/admin/categories/${id}`);
      setCategories(categories.filter((c) => c._id !== id));
      showMessage('success', 'Category deleted.');
    } catch (err) { showMessage('error', 'Delete failed.'); }
    finally { setActionLoading(null); }
  };

  const handleToggleCategoryActive = async (cat) => {
    setActionLoading(cat._id);
    try {
      const res = await api.put(`/admin/categories/${cat._id}`, { isActive: !cat.isActive });
      setCategories(categories.map((c) => (c._id === cat._id ? res.data.data : c)));
      showMessage('success', `Category ${!cat.isActive ? 'activated' : 'deactivated'}.`);
    } catch (err) { showMessage('error', 'Update failed.'); }
    finally { setActionLoading(null); }
  };

  // ============ HELPERS ============
  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const getInitials = (name) =>
    name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '?';

  const filteredReviews = reviewFilter === 'low'
    ? allReviews.filter((r) => r.rating <= 2)
    : allReviews;

  const filteredProducts = productSearch.trim()
    ? allProducts.filter((p) =>
        p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category?.toLowerCase().includes(productSearch.toLowerCase()))
    : allProducts;

  // Count products per category
  const getCategoryProductCount = (catName) =>
    allProducts.filter((p) => p.category === catName).length;

  if (loading) {
    return (
      <div className="admin-loading">
        <FaSpinner className="admin-spinner" />
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-layout">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={{
            customers: allCustomers.length,
            markets: markets.length,
            products: allProducts.length,
            categories: categories.length,
            reviews: allReviews.length,
            contact: contactMessages.length,
          }}
        />

        <main className="admin-main-content">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">
            <FaLeaf className="admin-title-icon" /> Admin Dashboard
          </h1>
          <p className="admin-subtitle">Welcome back, {user?.name}</p>
        </div>
        <div className="admin-header-actions">
          
          <div className="admin-header-dropdown-wrap">
            <button
              type="button"
              className="admin-profile-trigger"
              aria-expanded={showAdminProfile}
              onClick={() => setShowAdminProfile((open) => !open)}
            >
              <span className="admin-profile-avatar">Z</span>
              <span className="admin-profile-copy">
                <strong>Zainab</strong>
                <small>Zainab's Organic Hub</small>
              </span>
              <FaChevronDown className={showAdminProfile ? 'admin-profile-chevron open' : 'admin-profile-chevron'} />
            </button>
            {showAdminProfile && (
              <div className="admin-header-dropdown admin-profile-dropdown">
                <span className="admin-profile-dropdown-name">Zainab</span>
                <span className="admin-profile-dropdown-detail">Zainab's Organic Hub</span>
              </div>
            )}
          </div>

          <button className="admin-refresh-btn" onClick={fetchData}>
            <FaSyncAlt /> Refresh
          </button>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {message.text && (
        <div className={message.type === 'success' ? 'admin-alert-success' : 'admin-alert-error'}>
          {message.text}
        </div>
      )}

      {/* ============ OVERVIEW TAB ============ */}
      {activeTab === 'overview' && (
        <>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon green"><FaTractor /></div>
              <div className="admin-stat-info">
                <span className="admin-stat-number">{stats?.totalFarmers || 0}</span>
                <span className="admin-stat-label">Total Farmers</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon blue"><FaUsers /></div>
              <div className="admin-stat-info">
                <span className="admin-stat-number">{stats?.totalCustomers || 0}</span>
                <span className="admin-stat-label">Total Customers</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon orange"><FaStore /></div>
              <div className="admin-stat-info">
                <span className="admin-stat-number">{stats?.totalMarkets || 0}</span>
                <span className="admin-stat-label">Total Markets</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon purple"><FaShoppingBag /></div>
              <div className="admin-stat-info">
                <span className="admin-stat-number">{stats?.totalOrders || 0}</span>
                <span className="admin-stat-label">Total Orders</span>
              </div>
            </div>
          </div>

          <div className="admin-charts-grid">
            <div className="admin-chart-card admin-chart-wide">
              <div className="admin-chart-header">
                <div>
                  <h3><FaMoneyBillWave /> Revenue</h3>
                  <span className="admin-chart-summary">
                    Rs. {revenueChartData.reduce((total, day) => total + (Number(day.revenue) || 0), 0).toLocaleString()} in {chartRange} days
                  </span>
                </div>
                {renderChartRange()}
              </div>
              <div className="admin-chart-body">
                {revenueChartData.some((day) => Number(day.revenue) > 0) ? (
                  <ChartFrame>
                    <AreaChart data={revenueChartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#237a4b" stopOpacity={0.24} />
                          <stop offset="95%" stopColor="#237a4b" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8edf0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs. ${Number(value).toLocaleString()}`} width={76} />
                      <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#8dbca0', strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#237a4b" strokeWidth={3} fill="url(#adminRevenueFill)" activeDot={{ r: 6, fill: '#174f33', stroke: '#ffffff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ChartFrame>
                ) : (
                  <div className="admin-chart-empty">No completed-order revenue in this period</div>
                )}
              </div>
            </div>

            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <div>
                  <h3><FaShoppingBag /> Order Status</h3>
                  <span className="admin-chart-summary">{orderStatusTotal.toLocaleString()} orders tracked</span>
                </div>
              </div>
              <div className="admin-chart-body">
                {analyticsData?.statusChart?.length ? (
                  <ChartFrame>
                    <PieChart>
                      <Pie data={analyticsData.statusChart} dataKey="value" nameKey="name" innerRadius={62} outerRadius={94} paddingAngle={4} stroke="none">
                        {analyticsData.statusChart.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="#ffffff" strokeWidth={3} />
                        ))}
                        <Label
                          content={({ viewBox }) => (
                            <g>
                              <text x={viewBox.cx} y={viewBox.cy - 2} textAnchor="middle" fill="#1e293b" fontSize="27" fontWeight="700">
                                {orderStatusTotal.toLocaleString()}
                              </text>
                              <text x={viewBox.cx} y={viewBox.cy + 17} textAnchor="middle" fill="#64748b" fontSize="10">
                                orders
                              </text>
                            </g>
                          )}
                        />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #dce4e8' }} formatter={(value, name) => [`${value} orders`, name]} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ChartFrame>
                ) : (
                  <div className="admin-chart-empty">No orders yet</div>
                )}
              </div>
            </div>

            <div className="admin-chart-card admin-chart-wide">
              <div className="admin-chart-header">
                <div>
                  <h3><FaUsers /> New Users</h3>
                  <span className="admin-chart-summary">
                    {userGrowthData.reduce((total, day) => total + (Number(day.customers) || 0) + (Number(day.farmers) || 0), 0).toLocaleString()} joined in {chartRange} days
                  </span>
                </div>
                {renderChartRange()}
              </div>
              <div className="admin-chart-body">
                {userGrowthData.some((day) => Number(day.customers) > 0 || Number(day.farmers) > 0) ? (
                  <ChartFrame>
                    <LineChart data={userGrowthData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8edf0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={32} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #dce4e8' }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="customers" stroke="#3576a8" strokeWidth={3} name="Customers" dot={{ r: 3 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="farmers" stroke="#d17a2d" strokeWidth={3} name="Farmers" dot={{ r: 3 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ChartFrame>
                ) : (
                  <div className="admin-chart-empty">No new users in this period</div>
                )}
              </div>
            </div>

            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <h3><FaTrophy /> Top Farmers</h3>
              </div>
              <div className="admin-chart-body">
                {reports?.topFarmers?.length ? (
                  <ChartFrame>
                    <BarChart data={reports.topFarmers.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis dataKey="stallName" type="category" tick={{ fontSize: 11, fill: '#475569' }} width={90} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} formatter={(v) => [`Rs. ${v}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#237a4b" radius={[0, 8, 8, 0]} maxBarSize={60} background={{ fill: '#f2f6f3' }} activeBar={{ fill: '#174f33' }} />
                    </BarChart>
                  </ChartFrame>
                ) : (
                  <div className="admin-chart-empty">No sales yet</div>
                )}
              </div>
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section-header">
              <h2><FaCheckCircle className="admin-section-icon" /> Pending Farmer Approvals</h2>
              <span className="admin-badge">{pendingFarmers.length} pending</span>
            </div>
            {pendingFarmers.length === 0 ? (
              <div className="admin-empty">
                <FaCheckCircle className="admin-empty-icon" />
                <p>No pending farmers. All caught up!</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Phone</th><th>Registered</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {pendingFarmers.map((farmer) => (
                      <tr key={farmer._id}>
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-avatar">{farmer.name?.charAt(0).toUpperCase()}</div>
                            <span>{farmer.name}</span>
                          </div>
                        </td>
                        <td>{farmer.email}</td>
                        <td>{farmer.phone}</td>
                        <td>{new Date(farmer.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="admin-actions">
                            <button className="admin-btn-approve" onClick={() => handleApprove(farmer._id)} disabled={actionLoading === farmer._id}>
                              {actionLoading === farmer._id ? <FaSpinner className="admin-spinner-sm" /> : <FaCheckCircle />}
                              Approve
                            </button>
                            <button className="admin-btn-suspend" onClick={() => handleSuspend(farmer._id)} disabled={actionLoading === farmer._id}>
                              <FaBan /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============ CUSTOMERS TAB ============ */}
      {activeTab === 'customers' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2><FaUsers className="admin-section-icon" /> Customer Management</h2>
            <span className="admin-badge">{allCustomers.length} total</span>
          </div>
          {allCustomers.length === 0 ? (
            <div className="admin-empty">
              <FaUsers className="admin-empty-icon" />
              <p>No customers yet.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Phone</th><th>Favorites</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {allCustomers.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-avatar">
                            {getInitials(c.name)}
                            {c.imageUrl && (
                              <img
                                src={c.imageUrl}
                                alt=""
                                onError={(event) => { event.currentTarget.style.display = 'none'; }}
                              />
                            )}
                          </div>
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td>{c.email}</td>
                      <td>{c.phone}</td>
                      <td>{c.favorites?.length || 0}</td>
                      <td>
                        <span className={c.isActive ? 'status-badge-active' : 'status-badge-inactive'}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={c.isActive ? 'admin-btn-suspend' : 'admin-btn-approve'}
                          onClick={() => toggleCustomerStatus(c)}
                          disabled={actionLoading === c._id}
                        >
                          {actionLoading === c._id ? <FaSpinner className="admin-spinner-sm" /> :
                            c.isActive ? <><FaUserSlash /> Deactivate</> : <><FaUserCheck /> Activate</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============ MARKETS TAB ============ */}
      {activeTab === 'markets' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2><FaListAlt className="admin-section-icon" /> Market Management</h2>
            <button className="admin-btn-primary" onClick={openAddMarket}>
              <FaPlus /> Add Market
            </button>
          </div>
          {markets.length === 0 ? (
            <div className="admin-empty">
              <FaStore className="admin-empty-icon" />
              <p>No markets yet.</p>
            </div>
          ) : (
            <div className="admin-markets-grid">
              {markets.map((market) => (
                <div className="admin-market-card" key={market._id}>
                  <div className="admin-market-header">
                    <div className="admin-market-icon"><FaStore /></div>
                    <div className="admin-market-actions">
                      <button className="admin-btn-icon edit" onClick={() => openEditMarket(market)}>
                        <FaEdit />
                      </button>
                      <button className="admin-btn-icon delete" onClick={() => handleDeleteMarket(market._id)} disabled={actionLoading === market._id}>
                        {actionLoading === market._id ? <FaSpinner className="admin-spinner-sm" /> : <FaTrash />}
                      </button>
                    </div>
                  </div>
                  <h3 className="admin-market-name">{market.name}</h3>
                  <div className="admin-market-info">
                    <FaMapMarkerAlt className="admin-market-info-icon" />
                    <span>{market.address}</span>
                  </div>
                  <div className="admin-market-info">
                    <FaClock className="admin-market-info-icon" />
                    <span>{formatTime(market.timings?.open)} — {formatTime(market.timings?.close)}</span>
                  </div>
                  <div className="admin-market-days">
                    {DAYS.map((day) => (
                      <span key={day} className={market.operatingDays?.includes(day) ? 'admin-day-pill active' : 'admin-day-pill'}>
                        {day.charAt(0)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ PRODUCTS TAB ============ */}
      {activeTab === 'products' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2><FaBox className="admin-section-icon" /> Product Moderation</h2>
            <div className="admin-filter-group">
              <FaFilter className="admin-filter-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="admin-search-input"
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="admin-empty">
              <FaBoxOpen className="admin-empty-icon" />
              <p>No products found.</p>
            </div>
          ) : (
            <div className="admin-products-grid">
              {filteredProducts.map((p) => (
                <div className="admin-product-card" key={p._id}>
                  <div className="admin-product-image">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} />
                    ) : (
                      <div className="admin-product-placeholder"><FaLeaf /></div>
                    )}
                  </div>
                  <div className="admin-product-body">
                    <h4>{p.name}</h4>
                    <span className="admin-product-category">{p.category}</span>
                    <div className="admin-product-meta">
                      <span className="admin-product-price">Rs. {p.price}</span>
                      <span className="admin-product-stock">{p.stockQuantity} in stock</span>
                    </div>
                    <div className="admin-product-farmer">
                      <FaTractor /> {p.farmerId?.stallName || 'Unknown farmer'}
                    </div>
                    <button
                      className="admin-btn-delete-review"
                      onClick={() => handleRemoveProduct(p._id)}
                      disabled={actionLoading === p._id}
                    >
                      {actionLoading === p._id ? <FaSpinner className="admin-spinner-sm" /> : <FaTrash />}
                      Remove Product
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ ✨ CATEGORIES TAB (NEW) ============ */}
      {activeTab === 'categories' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2><FaTag className="admin-section-icon" /> Category Management</h2>
            <button className="admin-btn-primary" onClick={openAddCategory}>
              <FaPlus /> Add Category
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="admin-empty">
              <FaTag className="admin-empty-icon" />
              <p>No categories yet. Click "Add Category" to create your first one.</p>
            </div>
          ) : (
            <div className="admin-categories-grid">
              {categories.map((cat) => {
                const productCount = getCategoryProductCount(cat.name);
                return (
                  <div className={cat.isActive ? 'admin-category-card' : 'admin-category-card inactive'} key={cat._id}>
                    <div className="admin-category-image">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.name} />
                      ) : (
                        <div className="admin-category-placeholder">
                          <FaTag />
                        </div>
                      )}
                      <span className={cat.isActive ? 'admin-category-status active' : 'admin-category-status inactive'}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="admin-category-body">
                      <h4 className="admin-category-name">{cat.name}</h4>
                      <div className="admin-category-meta">
                        <FaBoxOpen />
                        <span>{productCount} product{productCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="admin-category-actions">
                        <button
                          className={cat.isActive ? 'admin-category-toggle on' : 'admin-category-toggle off'}
                          onClick={() => handleToggleCategoryActive(cat)}
                          disabled={actionLoading === cat._id}
                          title={cat.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {actionLoading === cat._id ? (
                            <FaSpinner className="admin-spinner-sm" />
                          ) : cat.isActive ? (
                            <><FaToggleOn /> Active</>
                          ) : (
                            <><FaToggleOff /> Inactive</>
                          )}
                        </button>
                        <button className="admin-btn-icon edit" onClick={() => openEditCategory(cat)} title="Edit">
                          <FaEdit />
                        </button>
                        <button className="admin-btn-icon delete" onClick={() => handleDeleteCategory(cat._id)} disabled={actionLoading === cat._id} title="Delete">
                          {actionLoading === cat._id ? <FaSpinner className="admin-spinner-sm" /> : <FaTrash />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============ REVIEWS TAB ============ */}
      {activeTab === 'reviews' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2><FaStar className="admin-section-icon" /> Content Moderation — Reviews</h2>
            <div className="admin-filter-group">
              <FaFilter className="admin-filter-icon" />
              <select value={reviewFilter} onChange={(e) => setReviewFilter(e.target.value)}>
                <option value="all">All Reviews ({allReviews.length})</option>
                <option value="low">Low Rating (≤ 2★)</option>
              </select>
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="admin-empty">
              <FaStar className="admin-empty-icon" />
              <p>No reviews found.</p>
            </div>
          ) : (
            <div className="admin-reviews-list">
              {filteredReviews.map((review) => (
                <div className="admin-review-card" key={review._id}>
                  <div className="admin-review-header">
                    <div className="admin-review-author">
                      <div className="admin-avatar">
                        {getInitials(review.customerId?.name)}
                        {review.customerId?.imageUrl && (
                          <img
                            src={review.customerId.imageUrl}
                            alt=""
                            onError={(event) => { event.currentTarget.style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <div>
                        <span className="admin-review-name">{review.customerId?.name || 'Anonymous'}</span>
                        <span className="admin-review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="admin-review-stars">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={i < review.rating ? 'star-filled' : 'star-empty'} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="admin-review-comment">"{review.comment}"</p>}
                  <div className="admin-review-meta">
                    <span>Product: {review.productId?.name || '—'}</span>
                    <span>Farmer: {review.farmerId?.stallName || '—'}</span>
                  </div>
                  <button className="admin-btn-delete-review" onClick={() => handleRemoveReview(review._id)} disabled={actionLoading === review._id}>
                    {actionLoading === review._id ? <FaSpinner className="admin-spinner-sm" /> : <FaCommentSlash />}
                    Remove Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2><FaEnvelope className="admin-section-icon" /> Customer Contact Messages</h2>
            <span className="admin-badge">{contactMessages.length} total</span>
          </div>
          {contactMessages.length === 0 ? (
            <div className="admin-empty">
              <FaEnvelope className="admin-empty-icon" />
              <p>No contact messages yet.</p>
            </div>
          ) : (
            <div className="admin-contact-list">
              {contactMessages.map((contactMessage) => (
                <article className="admin-contact-card" key={contactMessage._id}>
                  <div className="admin-contact-header">
                    <div>
                      <h3>{contactMessage.subject || 'No subject'}</h3>
                      <p>{contactMessage.name} · <a href={`mailto:${contactMessage.email}`}>{contactMessage.email}</a></p>
                    </div>
                    <time dateTime={contactMessage.createdAt}>
                      {new Date(contactMessage.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <p className="admin-contact-message">{contactMessage.message}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ MARKET MODAL ============ */}
      {showMarketModal && (
        <div className="admin-modal-overlay" onClick={() => setShowMarketModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingMarket ? 'Edit Market' : 'Add New Market'}</h2>
              <button className="admin-modal-close" onClick={() => setShowMarketModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleMarketSubmit} className="admin-modal-form">
              <div className="admin-form-group">
                <label>Market Name</label>
                <input type="text" value={marketForm.name} onChange={(e) => setMarketForm({ ...marketForm, name: e.target.value })} required />
              </div>
              <div className="admin-form-group">
                <label>Full Address</label>
                <input type="text" value={marketForm.address} onChange={(e) => setMarketForm({ ...marketForm, address: e.target.value })} required />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Latitude</label>
                  <input type="number" step="any" value={marketForm.lat} onChange={(e) => setMarketForm({ ...marketForm, lat: e.target.value })} required />
                </div>
                <div className="admin-form-group">
                  <label>Longitude</label>
                  <input type="number" step="any" value={marketForm.lng} onChange={(e) => setMarketForm({ ...marketForm, lng: e.target.value })} required />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Opening Time</label>
                  <input type="time" value={marketForm.openTime} onChange={(e) => setMarketForm({ ...marketForm, openTime: e.target.value })} required />
                </div>
                <div className="admin-form-group">
                  <label>Closing Time</label>
                  <input type="time" value={marketForm.closeTime} onChange={(e) => setMarketForm({ ...marketForm, closeTime: e.target.value })} required />
                </div>
              </div>
              <div className="admin-form-group">
                <label>Operating Days</label>
                <div className="admin-days-grid">
                  {DAYS.map((day) => (
                    <button key={day} type="button" className={marketForm.operatingDays.includes(day) ? 'admin-day-chip active' : 'admin-day-chip'} onClick={() => toggleMarketDay(day)}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-btn-cancel" onClick={() => setShowMarketModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn-primary" disabled={actionLoading === 'market'}>
                  {actionLoading === 'market' ? 'Saving...' : editingMarket ? 'Update Market' : 'Create Market'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ ✨ CATEGORY MODAL (NEW) ============ */}
      {showCategoryModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button className="admin-modal-close" onClick={() => setShowCategoryModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="admin-modal-form">
              <div className="admin-form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g., Vegetables, Fruits, Dairy"
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Category Image (optional)</label>
                <input
                  type="url"
                  value={categoryForm.imageUrl}
                  onChange={(e) => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })}
                  placeholder="https://res.cloudinary.com/..."
                />
                <input
                  ref={categoryFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCategoryImageUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="admin-category-upload"
                  onClick={() => categoryFileInputRef.current?.click()}
                  disabled={categoryImageUploading}
                >
                  {categoryImageUploading ? <FaSpinner className="admin-spinner-sm" /> : <FaImage />}
                  {categoryImageUploading ? 'Uploading photo...' : 'Upload from computer'}
                </button>
                <span className="admin-category-upload-hint">JPG, PNG, or WebP. Maximum 5MB.</span>
                {categoryImageError && <span className="admin-category-upload-error" role="alert">{categoryImageError}</span>}
                {categoryForm.imageUrl && (
                  <div className="admin-category-preview">
                    <FaImage />
                    <img
                      src={categoryForm.imageUrl}
                      alt="Preview"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
              <div className="admin-form-group">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={categoryForm.isActive}
                    onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                  />
                  <span>Active (visible to customers)</span>
                </label>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-btn-cancel" onClick={() => setShowCategoryModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn-primary" disabled={actionLoading === 'category' || categoryImageUploading}>
                  {categoryImageUploading ? 'Uploading...' : actionLoading === 'category' ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;