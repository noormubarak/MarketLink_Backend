import Order from '../models/Order.js';
import FarmerProfile from '../models/FarmerProfile.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, fail } from '../utils/response.js';
import { placeOrder } from '../services/orderService.js';
import { createNotification } from '../services/notificationService.js';

export const create = asyncHandler(async (req, res) => {
  const order = await placeOrder({ customerId: req.user._id, ...req.body });
  return ok(res, order, 'Order placed', 201);
});

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customerId: req.user._id })
    .populate({ path: 'farmerId', select: 'stallName location' })
    .populate('marketId', 'name address')
    .sort('-createdAt');
  return ok(res, orders);
});

export const farmerOrders = asyncHandler(async (req, res) => {
  const farmer = await FarmerProfile.findOne({ userId: req.user._id });
  if (!farmer) return fail(res, 'Farmer profile missing', 400);
  const orders = await Order.find({ farmerId: farmer._id })
    .populate('customerId', 'name phone email')
    .sort('-createdAt');
  return ok(res, orders);
});

export const getOne = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customerId', 'name phone')
    .populate('farmerId', 'stallName userId location')
    .populate('marketId', 'name address');
  if (!order) return fail(res, 'Order not found', 404);

  const isOwner =
    order.customerId._id.toString() === req.user._id.toString() ||
    order.farmerId.userId.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isOwner) return fail(res, 'Forbidden', 403);
  return ok(res, order);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['accepted','declined','ready','completed'];
  if (!allowed.includes(status)) return fail(res, 'Invalid status');

  const farmer = await FarmerProfile.findOne({ userId: req.user._id });
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, farmerId: farmer._id },
    { status }, { new: true }
  );
  if (!order) return fail(res, 'Order not found', 404);

  const msgMap = {
    accepted: 'Your order was accepted',
    declined: 'Your order was declined',
    ready:    'Your order is ready for pickup',
    completed:'Order completed — please leave a review',
  };
  await createNotification({
    userId: order.customerId,
    type: `order_${status}`,
    message: msgMap[status],
    link: `/orders/${order._id}`,
  });

  return ok(res, order, 'Status updated');
});

export const cancel = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customerId: req.user._id });
  if (!order) return fail(res, 'Order not found', 404);
  if (['completed','cancelled','declined'].includes(order.status))
    return fail(res, 'Cannot cancel this order');
  if (new Date() > order.cutoffTime)
    return fail(res, 'Cutoff has passed');

  order.status = 'cancelled';
  await order.save();

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.quantity } });
  }

  const farmer = await FarmerProfile.findById(order.farmerId);
  await createNotification({
    userId: farmer.userId,
    type: 'order_cancelled',
    message: 'An order was cancelled',
    link: `/farmer/orders/${order._id}`,
  });

  return ok(res, order, 'Order cancelled');
});

export const modify = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customerId: req.user._id });
  if (!order) return fail(res, 'Order not found', 404);
  if (new Date() > order.cutoffTime) return fail(res, 'Cutoff has passed');
  if (!['placed','accepted'].includes(order.status)) return fail(res, 'Cannot modify');

  const { items } = req.body;
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.quantity } });
  }

  let total = 0;
  const snapshot = [];
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || product.stockQuantity < item.quantity)
      return fail(res, 'Insufficient stock');
    snapshot.push({
      productId: product._id, name: product.name,
      price: product.price, quantity: item.quantity, unit: product.unit,
    });
    total += product.price * item.quantity;
    await Product.findByIdAndUpdate(product._id, { $inc: { stockQuantity: -item.quantity } });
  }
  order.items = snapshot;
  order.totalAmount = total;
  await order.save();
  return ok(res, order, 'Order updated');
});