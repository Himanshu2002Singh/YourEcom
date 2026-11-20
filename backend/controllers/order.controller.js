// /api/orders — placing orders, paying for them online and reading back the signed-in customer's own orders.
import * as Coupon from '../models/coupon.model.js';
import * as Order from '../models/order.model.js';
import * as Payment from '../services/payment.service.js';
import { priceOrder } from '../services/pricing.service.js';
import { HttpError } from '../utils/HttpError.js';
import { razorpayReady } from '../utils/razorpay.js';
import { cleanOrder, cleanPayment, cleanStatus } from '../validators/order.validator.js';
import { orderView } from '../views/order.view.js';

// POST /api/orders { items: [{ id, quantity, bulk? }], delivery, paymentMethod, couponCode? }. Prices, the GST
// on bulk items, the discount, the delivery fee and the totals are worked out here; any the browser sends are ignored.
// An order paid online also answers `payment`, the details Razorpay Checkout needs to collect it. If Razorpay
// can't take the payment, the order isn't kept.
export async function placeOrder(request, response) {
  const { items, delivery, paymentMethod, couponCode } = cleanOrder(request.body);
  if (paymentMethod === 'online' && !razorpayReady()) throw new HttpError(400, 'Online payment isn’t available yet. Choose cash on delivery.');
  const coupon = couponCode && await Coupon.findUsable(request.user.id, couponCode);
  const order = await Order.create(request.user.id, { ...await priceOrder(items, coupon), delivery, paymentMethod });
  if (paymentMethod === 'cod') return response.status(201).json({ order: orderView(order, request.user) });
  let payment;
  try {
    payment = await Payment.startPayment(order, request.user);
  } catch (error) {
    await Order.discard(order.id);
    throw error;
  }
  response.status(201).json({ order: orderView(await Order.findForUser(request.user.id, order.id), request.user), payment });
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
async function ownOrder(request) {
  const order = await Order.findForUser(request.user.id, request.params.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  return order;
}

export async function getOrder(request, response) {
  response.json({ order: orderView(await ownOrder(request), request.user) });
}

// POST /api/orders/:id/pay — Razorpay Checkout's details for paying an online order that isn't paid yet, such as
// one whose payment window was closed.
export async function payOrder(request, response) {
  const order = await ownOrder(request);
  if (order.payment_method !== 'online') throw new HttpError(409, 'This order is paid in cash on delivery.');
  if (order.paid_at) throw new HttpError(409, 'This order is already paid.');
  if (order.status === 'Cancelled') throw new HttpError(409, 'This order was cancelled, so there’s nothing to pay.');
  response.json({ payment: await Payment.startPayment(order, request.user) });
}

// POST /api/orders/:id/payment { razorpayPaymentId, razorpaySignature } — what Razorpay Checkout handed back after
// the customer paid. Answers the order, paid.
export async function confirmPayment(request, response) {
  const payment = cleanPayment(request.body);
  const order = await ownOrder(request);
  await Payment.confirmPayment(order, payment);
  response.json({ order: orderView(await Order.findForUser(request.user.id, order.id), request.user) });
}
