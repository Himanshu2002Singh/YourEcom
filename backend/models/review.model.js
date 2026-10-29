// The reviews table: one star rating (and optional comment) per customer per product.
import { query } from '../db/pool.js';

// A product's reviews, newest first, with each reviewer's name.
export async function listForProduct(productId) {
  return query(
    'SELECT reviews.*, users.name FROM reviews JOIN users ON users.id = reviews.user_id WHERE reviews.product_id = ? ORDER BY reviews.created_at DESC',
    [productId],
  );
}

// Whether the customer has ordered the product, in an order they didn't cancel.
export async function hasBought(userId, productId) {
  const rows = await query(
    "SELECT 1 FROM orders WHERE user_id = ? AND status <> 'Cancelled' AND JSON_CONTAINS(items, JSON_OBJECT('id', CAST(? AS UNSIGNED))) LIMIT 1",
    [userId, productId],
  );
  return rows.length > 0;
}

// Writing a second review of the same product replaces the first.
export async function save(userId, productId, { rating, comment }) {
  await query(
    'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)',
    [userId, productId, rating, comment],
  );
}
