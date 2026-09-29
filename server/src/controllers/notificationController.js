import Notification from '../models/Notification.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, fail } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const items = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 }).limit(50);
  const orderIds = items
    .filter((item) => !item.imageUrl)
    .map((item) => item.link.match(/^\/orders\/([a-f\d]{24})$/i)?.[1])
    .filter(Boolean);
  const orders = orderIds.length
    ? await Order.find({ _id: { $in: orderIds } }).select('items').lean()
    : [];
  const ordersById = new Map(orders.map((order) => [order._id.toString(), order]));
  const productIds = orders
    .filter((order) => !order.items?.[0]?.imageUrl && order.items?.[0]?.productId)
    .map((order) => order.items[0].productId);
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } }).select('imageUrl').lean()
    : [];
  const productsById = new Map(products.map((product) => [product._id.toString(), product]));

  const notifications = items.map((item) => {
    if (item.imageUrl) return item;
    const orderId = item.link.match(/^\/orders\/([a-f\d]{24})$/i)?.[1];
    const firstItem = orderId && ordersById.get(orderId)?.items?.[0];
    const product = firstItem?.productId && productsById.get(firstItem.productId.toString());
    return {
      ...item.toObject(),
      imageUrl: firstItem?.imageUrl || product?.imageUrl || '',
    };
  });

  return ok(res, notifications);
});

export const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true }, { new: true }
  );
  if (!n) return fail(res, 'Not found', 404);
  return ok(res, n, 'Marked read');
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true }
  );
  return ok(res, null, 'All marked read');
});