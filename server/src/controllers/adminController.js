import User from '../models/User.js';
import Market from '../models/Market.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, fail } from '../utils/response.js';

export const dashboard = asyncHandler(async (req, res) => {
  const [totalFarmers, totalCustomers, totalMarkets, totalOrders] = await Promise.all([
    User.countDocuments({ role: 'farmer' }),
    User.countDocuments({ role: 'customer' }),
    Market.countDocuments(),
    Order.countDocuments(),
  ]);
  return ok(res, { totalFarmers, totalCustomers, totalMarkets, totalOrders });
});

export const pendingFarmers = asyncHandler(async (req, res) => {
  const list = await User.find({ role: 'farmer', isApproved: false })
    .select('name email phone createdAt');
  return ok(res, list);
});

export const approveFarmer = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id, { isApproved: true }, { new: true }
  ).select('-passwordHash');
  if (!user) return fail(res, 'Farmer not found', 404);
  return ok(res, user, 'Farmer approved');
});

export const suspendFarmer = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id, { isActive: false }, { new: true }
  ).select('-passwordHash');
  if (!user) return fail(res, 'Farmer not found', 404);
  return ok(res, user, 'Farmer suspended');
});

export const setCustomerStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id, { isActive }, { new: true }
  ).select('-passwordHash');
  if (!user) return fail(res, 'Customer not found', 404);
  return ok(res, user, 'Status updated');
});

export const reports = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const completed = await Order.countDocuments({ status: 'completed' });
  const revenue = await Order.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const topFarmers = await Order.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: '$farmerId', orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'farmerprofiles', localField: '_id', foreignField: '_id', as: 'farmer' } },
    { $unwind: '$farmer' },
    { $project: { stallName: '$farmer.stallName', orders: 1, revenue: 1 } },
  ]);
  return ok(res, {
    totalOrders, completed,
    totalRevenue: revenue[0]?.total || 0,
    topFarmers,
  });
});

export const removeProduct = asyncHandler(async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) return fail(res, 'Product not found', 404);
  return ok(res, null, 'Product removed by admin');
});

// ═══════════════════════════════════════════════════════════
// ✨ CUSTOMER MANAGEMENT (NEW)
// ═══════════════════════════════════════════════════════════
export const listCustomers = asyncHandler(async (req, res) => {
  const customers = await User.find({ role: 'customer' })
    .select('name email phone address isActive favorites createdAt')
    .sort('-createdAt');
  return ok(res, customers);
});

// ═══════════════════════════════════════════════════════════
// ✨ CONTENT MODERATION — REVIEWS (NEW)
// ═══════════════════════════════════════════════════════════
export const listReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('customerId', 'name email')
    .populate('productId', 'name')
    .populate({ path: 'farmerId', select: 'stallName' })
    .sort('-createdAt')
    .limit(200);
  return ok(res, reviews);
});

export const removeReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return fail(res, 'Review not found', 404);
  return ok(res, null, 'Review removed by admin');
});

// ═══════════════════════════════════════════════════════════
// ✨ MARKET MANAGEMENT (NEW)
// ═══════════════════════════════════════════════════════════

export const createMarket = asyncHandler(async (req, res) => {
  const { name, address, lat, lng, operatingDays, timings, location } = req.body;

  if (!name || !address || lat === undefined || lng === undefined) {
    return fail(res, 'name, address, lat and lng are required');
  }
  if (!operatingDays || operatingDays.length === 0) {
    return fail(res, 'At least one operating day is required');
  }

  const market = await Market.create({
    name: name.trim(),
    address: address.trim(),
    lat: Number(lat),
    lng: Number(lng),
    operatingDays,
    timings: timings || { open: '06:00', close: '14:00' },
    location: location || {
      type: 'Point',
      coordinates: [Number(lng), Number(lat)],
    },
    createdBy: req.user._id,
  });

  return ok(res, market, 'Market created', 201);
});

export const updateMarket = asyncHandler(async (req, res) => {
  const { name, address, lat, lng, operatingDays, timings, location } = req.body;

  const market = await Market.findByIdAndUpdate(
    req.params.id,
    {
      ...(name && { name: name.trim() }),
      ...(address && { address: address.trim() }),
      ...(lat !== undefined && { lat: Number(lat) }),
      ...(lng !== undefined && { lng: Number(lng) }),
      ...(operatingDays && { operatingDays }),
      ...(timings && { timings }),
      ...(location && { location }),
    },
    { new: true, runValidators: true }
  );

  if (!market) return fail(res, 'Market not found', 404);
  return ok(res, market, 'Market updated');
});

export const deleteMarket = asyncHandler(async (req, res) => {
  const market = await Market.findByIdAndDelete(req.params.id);
  if (!market) return fail(res, 'Market not found', 404);
  return ok(res, null, 'Market deleted');
});


// ═══════════════════════════════════════════════════════════
// ✨ ANALYTICS — Chart Data (NEW)
// ═══════════════════════════════════════════════════════════
export const analytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const days = 14;
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // 1. Revenue over last 14 days
  const revenueByDay = await Order.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill missing days with zero
  const revenueChart = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    const found = revenueByDay.find((r) => r._id === key);
    revenueChart.push({
      date: key,
      label: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      revenue: found?.revenue || 0,
      orders: found?.orders || 0,
    });
  }

  // 2. Order status distribution
  const statusAgg = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const STATUS_COLORS = {
    placed: '#f59e0b',
    accepted: '#3b82f6',
    ready: '#8b5cf6',
    completed: '#10b981',
    declined: '#ef4444',
    cancelled: '#6b7280',
  };

  const statusChart = statusAgg.map((s) => ({
    name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
    value: s.count,
    color: STATUS_COLORS[s._id] || '#94a3b8',
  }));

  // 3. New users over time (last 14 days)
  const usersByDay = await User.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          role: '$role',
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.date': 1 } },
  ]);

  const userGrowth = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    const customers = usersByDay.find((u) => u._id.date === key && u._id.role === 'customer');
    const farmers = usersByDay.find((u) => u._id.date === key && u._id.role === 'farmer');
    userGrowth.push({
      date: key,
      label: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      customers: customers?.count || 0,
      farmers: farmers?.count || 0,
    });
  }

  // 4. Category distribution (products per category)
  const categoryAgg = await Product.aggregate([
    { $match: { isTemplate: false } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const categoryChart = categoryAgg.map((c) => ({
    name: c._id || 'Uncategorized',
    products: c.count,
  }));

  return ok(res, {
    revenueChart,
    statusChart,
    userGrowth,
    categoryChart,
  });
});

// ═══════════════════════════════════════════════════════════
// ✨ PRODUCTS MODERATION (NEW)
// ═══════════════════════════════════════════════════════════
export const listAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isTemplate: false })
    .populate({ path: 'farmerId', select: 'stallName' })
    .sort('-createdAt')
    .limit(500);
  return ok(res, products);
});