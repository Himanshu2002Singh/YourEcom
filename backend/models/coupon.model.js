// The coupons table: discount codes for the checkout (seeded by db/schema.js).
import { query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';

// Why this customer can't use the coupon, as an HttpError to throw; null when they can.
// `orders` are the customer's orders that weren't cancelled ({ coupon_code } each).
function problemWith(coupon, orders) {
  if (!coupon?.active) return new HttpError(404, 'That coupon code isn’t valid. Check it and try again.');
  if (coupon.expires_at && coupon.expires_at <= new Date()) return new HttpError(400, `${coupon.code} has expired.`);
  if (orders.some(order => order.coupon_code === coupon.code)) return new HttpError(400, `You’ve already used ${coupon.code}. Each code works once per customer.`);
  if (coupon.first_order_only && orders.length) return new HttpError(400, `${coupon.code} is only for your first order.`);
  return null;
}

const activeOrdersSql = "SELECT coupon_code FROM orders WHERE user_id = ? AND status <> 'Cancelled'";

// The coupons this customer can use now, smallest minimum order first. The minimum order itself
// isn't checked here: the checkout shows how much more is needed.
export async function listUsable(userId) {
  const [coupons, orders] = await Promise.all([
    query('SELECT * FROM coupons WHERE active ORDER BY min_subtotal, code'),
    query(activeOrdersSql, [userId]),
  ]);
  return coupons.filter(coupon => !problemWith(coupon, orders));
}

// The coupon `code` if this customer can use it, otherwise throws why not. Placing an order passes
// its transaction's `connection`, which has already locked the customer's row (models/order.model.js):
// the orders are then read as locked rows too, so two orders placed at once can't both use a code.
export async function findUsable(userId, code, connection) {
  const [coupon] = await query('SELECT * FROM coupons WHERE code = ?', [code]);
  const orders = connection ? (await connection.execute(`${activeOrdersSql} FOR UPDATE`, [userId]))[0] : await query(activeOrdersSql, [userId]);
  const problem = problemWith(coupon, orders);
  if (problem) throw problem;
  return coupon;
}
