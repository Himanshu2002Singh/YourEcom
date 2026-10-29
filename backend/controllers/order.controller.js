// /api/orders — placing orders and reading back the signed-in customer's own orders.
import * as Coupon from '../models/coupon.model.js';
import * as Order from '../models/order.model.js';
import { priceOrder } from '../services/pricing.service.js';
import { HttpError } from '../utils/HttpError.js';
import { cleanOrder, cleanStatus } from '../validators/order.validator.js';
import { orderView } from '../views/order.view.js';

// POST /api/orders { items: [{ id, quantity }], delivery, paymentMethod, couponCode? }. Prices,
// the discount, the delivery fee and the totals are worked out here; any the browser sends are ignored.
export async function placeOrder(request, response) {
  const { items, delivery, paymentMethod, couponCode } = cleanOrder(request.body);
  const coupon = couponCode && await Coupon.findUsable(request.user.id, couponCode);
  const order = await Order.create(request.user.id, { ...await priceOrder(items, coupon), delivery, paymentMethod });
  response.status(201).json({ order: orderView(order, request.user) });
}

// GET /api/orders?status=Processing — newest first; status is optional.
export async function listOrders(request, response) {
  const orders = await Order.listForUser(request.user.id, cleanStatus(request.query.status));
  response.json({ orders: orders.map(order => orderView(order, request.user)) });
}

// POST /api/orders/:id/cancel — only while the order is still Processing (409 after that).
export async function cancelOrder(request, response) {
  const order = await Order.cancelForUser(request.user.id, request.params.id);
  response.json({ order: orderView(order, request.user) });
}

// Someone else's order answers 404, the same as one that doesn't exist.
export async function getOrder(request, response) {
  const order = await Order.findForUser(request.user.id, request.params.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  response.json({ order: orderView(order, request.user) });
}
