import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  FaUsers, FaStore, FaShoppingBag, FaTractor,
  FaCheckCircle, FaBan, FaSpinner, FaSyncAlt,
  FaLeaf, FaChartLine, FaMoneyBillWave, FaTrophy,
  FaPlus, FaEdit, FaTrash, FaTimes, FaMapMarkerAlt,
  FaClock, FaCalendarAlt, FaListAlt, FaUserSlash, FaUserCheck,
  FaStar, FaCommentSlash, FaFilter, FaBox, FaTag, FaBoxOpen,
  FaImage, FaToggleOn, FaToggleOff
} from 'react-icons/fa';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import './Admin.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Data
  const [stats, setStats] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [pendingFarmers, setPendingFarmers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [reports, setReports] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [categories, setCategories] = useState([]);

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
  const [categoryForm, setCategoryForm] = useState({
    name: '', imageUrl: '', isActive: true,
  });

  // ============ FETCH ALL DATA ============
  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        statsRes, pendingRes, reportsRes, marketsRes,
        custRes, revRes, prodRes, analyticsRes, catRes
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
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || '',
      imageUrl: cat.imageUrl || '',
      isActive: cat.isActive !== false,
    });
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return showMessage('error', 'Category name is required.');

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
      <div className="admin-header">
        <div>
          <h1 className="admin-title">
            <FaLeaf className="admin-title-icon" /> Admin Dashboard
          </h1>
          <p className="admin-subtitle">Welcome back, {user?.name}</p>
        </div>
        <button className="admin-refresh-btn" onClick={fetchData}>
          <FaSyncAlt /> Refresh
        </button>
      </div>

      {message.text && (
        <div className={message.type === 'success' ? 'admin-alert-success' : 'admin-alert-error'}>
          {message.text}
        </div>
      )}

      <div className="admin-tabs">
        <button className={activeTab === 'overview' ? 'admin-tab active' : 'admin-tab'} onClick={() => setActiveTab('overview')}>
          <FaChartLine /> Overview
        </button>
        <button className={activeTab === 'customers' ? 'admin-tab active' : 'admin-tab'} onClick={() => setActiveTab('customers')}>
          <FaUsers /> Customers ({allCustomers.length})
        </button>
        <button className={activeTab === 'markets' ? 'admin-tab active' : 'admin-tab'} onClick={() => setActiveTab('markets')}>
          <FaStore /> Markets ({markets.length})
        </button>
        <button className={activeTab === 'products' ? 'admin-tab active' : 'admin-tab'} onClick={() => setActiveTab('products')}>
          <FaBox /> Products ({allProducts.length})
        </button>
        <button className={activeTab === 'categories' ? 'admin-tab active' : 'admin-tab'} onClick={() => setActiveTab('categories')}>
          <FaTag /> Categories ({categories.length})
        </button>
        <button className={activeTab === 'reviews' ? 'admin-tab active' : 'admin-tab'} onClick={() => setActiveTab('reviews')}>
          <FaStar /> Reviews ({allReviews.length})
        </button>
      </div>

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
                <h3><FaMoneyBillWave /> Revenue — Last 14 Days</h3>
              </div>
              <div className="admin-chart-body">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={analyticsData?.revenueChart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `Rs. ${v}`} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontFamily: 'Outfit' }} formatter={(v) => [`Rs. ${v}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#2e7d32" strokeWidth={3} dot={{ fill: '#2e7d32', r: 4 }} activeDot={{ r: 6, fill: '#1b5e20' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <h3><FaShoppingBag /> Order Status</h3>
              </div>
              <div className="admin-chart-body">
                {analyticsData?.statusChart?.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={analyticsData.statusChart} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                        {analyticsData.statusChart.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="admin-chart-empty">No orders yet</div>
                )}
              </div>
            </div>

            <div className="admin-chart-card admin-chart-wide">
              <div className="admin-chart-header">
                <h3><FaUsers /> New Users — Last 14 Days</h3>
              </div>
              <div className="admin-chart-body">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={analyticsData?.userGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="customers" stroke="#3b82f6" strokeWidth={3} name="Customers" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="farmers" stroke="#10b981" strokeWidth={3} name="Farmers" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <h3><FaTrophy /> Top Farmers</h3>
              </div>
              <div className="admin-chart-body">
                {reports?.topFarmers?.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={reports.topFarmers.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis dataKey="stallName" type="category" tick={{ fontSize: 11, fill: '#475569' }} width={90} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} formatter={(v) => [`Rs. ${v}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#2e7d32" radius={[0, 8, 8, 0]} maxBarSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
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
                          <div className="admin-avatar">{getInitials(c.name)}</div>
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
                      <div className="admin-avatar">{getInitials(review.customerId?.name)}</div>
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
                <label>Image URL (optional)</label>
                <input
                  type="url"
                  value={categoryForm.imageUrl}
                  onChange={(e) => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })}
                  placeholder="https://res.cloudinary.com/..."
                />
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
                <button type="submit" className="admin-btn-primary" disabled={actionLoading === 'category'}>
                  {actionLoading === 'category' ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;