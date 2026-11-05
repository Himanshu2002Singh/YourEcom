// The users table: customer accounts and their preferences.
import { randomUUID } from 'node:crypto';
import { query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';

const isDuplicate = error => error?.code === 'ER_DUP_ENTRY';

export async function findById(id) {
  return (await query('SELECT * FROM users WHERE id = ?', [id]))[0] ?? null;
}

export async function findByEmail(email) {
  return (await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]))[0] ?? null;
}

// New accounts start with both preferences on, as the storefront's do.
export async function create({ email, name, passwordHash }) {
  const id = randomUUID();
  try {
    await query('INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)', [id, email.toLowerCase(), name, passwordHash]);
  } catch (error) {
    if (isDuplicate(error)) throw new HttpError(409, 'An account with this email already exists. Sign in instead.');
    throw error;
  }
  return findById(id);
}

// Sign in with Google (googleId is the Google account's "sub"): the account already linked to that Google
// account; else the account with the same email address, which Google has verified, linked to it now; else a
// new account without a password. Answers { user, created }.
export async function signInWithGoogle({ googleId, email, name }) {
  const linked = (await query('SELECT * FROM users WHERE google_id = ?', [googleId]))[0];
  if (linked) return { user: linked, created: false };
  const existing = await findByEmail(email);
  if (existing) {
    if (existing.google_id) throw new HttpError(409, 'This email address is already linked to a different Google account.');
    await query('UPDATE users SET google_id = ? WHERE id = ? AND google_id IS NULL', [googleId, existing.id]);
    return { user: await findById(existing.id), created: false };
  }
  const id = randomUUID();
  try {
    await query('INSERT INTO users (id, email, name, google_id) VALUES (?, ?, ?, ?)', [id, email.toLowerCase(), name, googleId]);
  } catch (error) {
    // The same customer signing in twice at once: the other request made the account, so use it.
    if (isDuplicate(error)) return signInWithGoogle({ googleId, email, name });
    throw error;
  }
  return { user: await findById(id), created: true };
}

export async function updateName(id, name) {
  await query('UPDATE users SET name = ? WHERE id = ?', [name, id]);
  return findById(id);
}

// Also raises session_version, which signs the account out everywhere else.
export async function updatePassword(id, passwordHash) {
  await query('UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?', [passwordHash, id]);
  return findById(id);
}

export async function updatePreferences(id, { smsUpdates, offers }) {
  await query('UPDATE users SET sms_updates = ?, offers = ? WHERE id = ?', [smsUpdates, offers, id]);
  return findById(id);
}
