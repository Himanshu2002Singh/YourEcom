// The orders table: what each customer bought, priced and copied when they ordered.
import { randomInt } from 'node:crypto';
import { query, transaction } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';
import * as Coupon from './coupon.model.js';

const isDuplicate = error => error?.code === 'ER_DUP_ENTRY';

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

// order: { items, subtotal, discount, couponCode, deliveryFee, total, delivery, paymentMethod }
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
          'INSERT INTO orders (id, user_id, items, subtotal, discount, coupon_code, delivery_fee, total, delivery, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [number, userId, JSON.stringify(order.items), order.subtotal, order.discount, order.couponCode, order.deliveryFee, order.total, JSON.stringify(order.delivery), order.paymentMethod],
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

// Cancels one of the customer's orders and puts its items back in stock. Only an order that
// is still Processing can be cancelled.
export async function cancelForUser(userId, id) {
  await transaction(async connection => {
    const [[order]] = await connection.execute('SELECT status, items FROM orders WHERE id = ? AND user_id = ? FOR UPDATE', [id, userId]);
    if (!order) throw new HttpError(404, 'Order not found.');
    if (order.status === 'Cancelled') throw new HttpError(409, 'This order is already cancelled.');
    if (order.status !== 'Processing') throw new HttpError(409, 'This order has already been delivered, so it can’t be cancelled.');
    await connection.execute("UPDATE orders SET status = 'Cancelled' WHERE id = ?", [id]);
    for (const { id: productId, quantity } of order.items) await connection.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [quantity, productId]);
  });
  return findForUser(userId, id);
}

// One of the customer's orders, or null (also when it is someone else's).
export async function findForUser(userId, id) {
  return (await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, userId]))[0] ?? null;
}
