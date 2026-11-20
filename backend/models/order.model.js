// The orders table: what each customer bought, priced and copied when they ordered.
import { randomInt } from 'node:crypto';
import { query, transaction } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';
import { STATUSES } from '../validators/order.validator.js';
import * as Coupon from './coupon.model.js';

const isDuplicate = error => error?.code === 'ER_DUP_ENTRY';

// For the admin pages: orders with the name and email of the account that placed them.
const WITH_CUSTOMER = 'SELECT orders.*, users.name AS customer_name, users.email AS customer_email FROM orders JOIN users ON users.id = orders.user_id';

// LIKE matches `text` anywhere, with % and _ in it as plain characters.
const containing = text => `%${text.replace(/[\\%_]/g, '\\$&')}%`;

// Order numbers look like YE12345678: 'YE' and 8 random digits.
const orderNumber = () => `YE${String(randomInt(1e8)).padStart(8, '0')}`;

// Locks the ordered products' rows, checks there is enough of each, and takes the quantities
// out of stock. Runs inside the order's transaction, so two customers can't buy the last box.
async function takeFromStock(connection, items) {
  const [rows] = await connection.query('SELECT id, stock FROM products WHERE id IN (?) FOR UPDATE', [items.map(item => item.id)]);
  const stock = new Map(rows.map(row => [row.id, row.stock]));
  for (const { id, name, quantity } of items) {
    const left = stock.get(id) ?? 0;
    if (left === 0) throw new HttpError(409, `${name} is out of stock. Remove it from your cart to order the rest.`);
    if (quantity > left) throw new HttpError(409, `Only ${left} left of ${name}. Lower the quantity and try again.`);
  }
  for (const { id, quantity } of items) await connection.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, id]);
}

// order: { items, subtotal, discount, couponCode, gst, deliveryFee, total, delivery, paymentMethod }
// (see services/pricing.service.js). With a coupon, the customer's row is locked first so their
// orders are placed one at a time, and the code is checked again. In the rare case an order
// number is taken, another is drawn.
export async function create(userId, order) {
  const id = await transaction(async connection => {
    if (order.couponCode) {
      await connection.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);
      await Coupon.findUsable(userId, order.couponCode, connection);
    }
    await takeFromStock(connection, order.items);
    for (let attempt = 1; ; attempt += 1) {
      const number = orderNumber();
      try {
        await connection.execute(
          'INSERT INTO orders (id, user_id, items, subtotal, discount, coupon_code, gst, delivery_fee, total, delivery, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            number, userId, JSON.stringify(order.items), order.subtotal, order.discount, order.couponCode, order.gst, order.deliveryFee, order.total,
            JSON.stringify(order.delivery), order.paymentMethod,
          ],
        );
        return number;
      } catch (error) {
        if (!isDuplicate(error) || attempt === 5) throw error;
      }
    }
  });
  return findForUser(userId, id);
}

// The customer's orders, newest first; with `status`, only the orders in that state.
export async function listForUser(userId, status) {
  return status
    ? query('SELECT * FROM orders WHERE user_id = ? AND status = ? ORDER BY placed_at DESC', [userId, status])
    : query('SELECT * FROM orders WHERE user_id = ? ORDER BY placed_at DESC', [userId]);
}

// Marks an order Cancelled and puts its items back in stock, inside a transaction that has locked its row.
async function cancelLocked(connection, id, items) {
  await connection.execute("UPDATE orders SET status = 'Cancelled' WHERE id = ?", [id]);
  for (const { id: productId, quantity } of items) await connection.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [quantity, productId]);
}

// Cancels one of the customer's orders and puts its items back in stock. Only an order that
// is still Processing can be cancelled.
export async function cancelForUser(userId, id) {
  await transaction(async connection => {
    const [[order]] = await connection.execute('SELECT status, items FROM orders WHERE id = ? AND user_id = ? FOR UPDATE', [id, userId]);
    if (!order) throw new HttpError(404, 'Order not found.');
    if (order.status === 'Cancelled') throw new HttpError(409, 'This order is already cancelled.');
    if (order.status !== 'Processing') throw new HttpError(409, `This order has already ${order.status === 'Shipped' ? 'shipped' : 'been delivered'}, so it can’t be cancelled.`);
    await cancelLocked(connection, id, order.items);
  });
  return findForUser(userId, id);
}

// Takes back an order whose online payment couldn't even be started: its items go back in stock and the order is
// deleted, as if it had never been placed.
export async function discard(id) {
  await transaction(async connection => {
    const [[order]] = await connection.execute('SELECT items FROM orders WHERE id = ? FOR UPDATE', [id]);
    if (!order) return;
    for (const { id: productId, quantity } of order.items) await connection.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [quantity, productId]);
    await connection.execute('DELETE FROM orders WHERE id = ?', [id]);
  });
}

// Keeps the Razorpay order that collects an order's payment, unless it already has one. Answers the one it keeps.
export async function setRazorpayOrder(id, razorpayOrderId) {
  await query('UPDATE orders SET razorpay_order_id = ? WHERE id = ? AND razorpay_order_id IS NULL', [razorpayOrderId, id]);
  return (await query('SELECT razorpay_order_id FROM orders WHERE id = ?', [id]))[0]?.razorpay_order_id ?? razorpayOrderId;
}

// The order a Razorpay order collects the payment for, or null.
export async function findByRazorpayOrder(razorpayOrderId) {
  return (await query('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpayOrderId]))[0] ?? null;
}

// Records an online order's payment (a Razorpay payment ID), once.
export async function markPaid(id, paymentId) {
  await query('UPDATE orders SET paid_at = CURRENT_TIMESTAMP(6), razorpay_payment_id = ? WHERE id = ? AND paid_at IS NULL', [paymentId, id]);
}

// One of the customer's orders, or null (also when it is someone else's).
export async function findForUser(userId, id) {
  return (await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, userId]))[0] ?? null;
}

// Any customer's order, with its customer (WITH_CUSTOMER), or null. For the admin pages.
export async function findById(id) {
  return (await query(`${WITH_CUSTOMER} WHERE orders.id = ?`, [id]))[0] ?? null;
}

// One page of every customer's orders, for the admin pages (validators/admin.validator.js cleans the filter).
// With `status`, only those: Processing ones oldest first, as the queue to pack and ship, the rest newest first.
// With `search`, those whose number, customer name or email, delivery name, city or pincode contains it, or
// whose phone does when the search is a number however it is spaced. Answers { rows, total }.
export async function listAll({ status, search, page, pageSize }) {
  const where = [];
  const params = [];
  if (status) {
    where.push('orders.status = ?');
    params.push(status);
  }
  if (search) {
    // The delivery details are JSON, whose text compares case-sensitively, so both sides are lower-cased.
    const fields = ['orders.id', 'users.name', 'users.email', "orders.delivery->>'$.name'", "orders.delivery->>'$.city'", "orders.delivery->>'$.pincode'"];
    const matches = fields.map(field => `LOWER(${field}) LIKE ?`);
    params.push(...fields.map(() => containing(search.toLowerCase())));
    const digits = /^[\d\s()+-]+$/.test(search) ? search.replace(/\D/g, '').slice(-10) : '';
    if (digits) {
      matches.push("REGEXP_REPLACE(orders.delivery->>'$.phone', '[^0-9]', '') LIKE ?");
      params.push(containing(digits));
    }
    where.push(`(${matches.join(' OR ')})`);
  }
  const filter = where.length ? ` WHERE ${where.join(' AND ')}` : '';
  // page and pageSize are whole numbers (validators/admin.validator.js), so they go into the SQL as they are.
  const [rows, [{ total }]] = await Promise.all([
    query(`${WITH_CUSTOMER}${filter} ORDER BY orders.placed_at ${status === 'Processing' ? 'ASC' : 'DESC'} LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`, params),
    query(`SELECT COUNT(*) AS total FROM orders JOIN users ON users.id = orders.user_id${filter}`, params),
  ]);
  return { rows, total: Number(total) };
}

// How many orders are in each status: { Processing, Shipped, Delivered, Cancelled }.
export async function countByStatus() {
  const rows = await query('SELECT status, COUNT(*) AS count FROM orders GROUP BY status');
  return Object.fromEntries(STATUSES.map(status => [status, Number(rows.find(row => row.status === status)?.count ?? 0)]));
}

// The orders placed since `since` (a Date) that weren't cancelled, leaving out those paid online whose payment
// hasn't come in: { orders, sales }, sales being their totals.
export async function salesSince(since) {
  const [{ orders, sales }] = await query(
    "SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS sales FROM orders WHERE placed_at >= ? AND status <> 'Cancelled' AND (payment_method = 'cod' OR paid_at IS NOT NULL)",
    [since],
  );
  return { orders: Number(orders), sales: Number(sales) };
}

// An admin moves an order on: to Shipped with its courier and tracking number (which can be changed while it's
// Shipped), to Delivered, or to Cancelled, which puts its items back in stock. Delivered and Cancelled are final.
export async function setStatus(id, { status, tracking }) {
  await transaction(async connection => {
    const [[order]] = await connection.execute('SELECT status, items FROM orders WHERE id = ? FOR UPDATE', [id]);
    if (!order) throw new HttpError(404, 'Order not found.');
    if (order.status === 'Delivered' || order.status === 'Cancelled') throw new HttpError(409, `This order is already ${order.status.toLowerCase()}, so it can’t be changed.`);
    if (status === 'Cancelled') await cancelLocked(connection, id, order.items);
    else if (status === 'Shipped') await connection.execute("UPDATE orders SET status = 'Shipped', tracking = ? WHERE id = ?", [tracking, id]);
    else await connection.execute("UPDATE orders SET status = 'Delivered' WHERE id = ?", [id]);
  });
  return findById(id);
}
