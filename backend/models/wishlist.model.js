// The wishlist table: products each customer saved for later.
import { query } from '../db/pool.js';

// The customer's saved product ids, most recently saved first.
export async function productIds(userId) {
  return (await query('SELECT product_id FROM wishlist WHERE user_id = ? ORDER BY added_at DESC', [userId])).map(row => row.product_id);
}

// Saving a product that is already saved changes nothing.
export async function add(userId, productId) {
  await query('INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)', [userId, productId]);
}

export async function remove(userId, productId) {
  await query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
}
