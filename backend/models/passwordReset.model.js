// The password_resets table: one-time links for customers who forgot their password.
import { createHash, randomBytes } from 'node:crypto';
import { query } from '../db/pool.js';

export const LINK_MINUTES = 30;

const hashOf = token => createHash('sha256').update(String(token ?? '')).digest('hex');

// A new link token for the customer, good for LINK_MINUTES. Expired links are cleared out on the way.
export async function create(userId) {
  await query('DELETE FROM password_resets WHERE expires_at <= NOW()');
  const token = randomBytes(32).toString('base64url');
  await query(`INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, NOW() + INTERVAL ${LINK_MINUTES} MINUTE)`, [hashOf(token), userId]);
  return token;
}

// Uses up a link: the customer's id if the token is unexpired, otherwise null. The row is deleted
// before the id is returned, so two requests with the same link can't both succeed.
export async function use(token) {
  const hash = hashOf(token);
  const [row] = await query('SELECT user_id FROM password_resets WHERE token_hash = ? AND expires_at > NOW()', [hash]);
  if (!row) return null;
  const { affectedRows } = await query('DELETE FROM password_resets WHERE token_hash = ?', [hash]);
  return affectedRows === 1 ? row.user_id : null;
}

// Every other link the customer was sent stops working.
export async function removeForUser(userId) {
  await query('DELETE FROM password_resets WHERE user_id = ?', [userId]);
}
