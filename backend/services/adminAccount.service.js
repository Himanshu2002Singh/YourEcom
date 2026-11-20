// The store owner's admin account, from ADMIN_EMAIL and ADMIN_PASSWORD (backend/.env.example). server.js runs this
// when the API starts: it creates the account as an admin if no account uses that email yet. An existing account
// is never made an admin this way, because anyone could have signed up with the address first; `npm run admin`
// does that, on purpose. The password is only used to create the account, so changing it later is done in the store.
import { query } from '../db/pool.js';
import * as User from '../models/user.model.js';
import { hashPassword } from '../utils/password.js';
import { cleanEmail } from '../validators/email.validator.js';
import { passwordProblem } from '../validators/password.validator.js';

// Answers what it did, for the server's log, or null when there was nothing to do. Throws if the settings are
// half filled in or unusable.
export async function ensureAdminAccount({ ADMIN_EMAIL: rawEmail = '', ADMIN_PASSWORD: password = '' } = process.env) {
  if (!rawEmail.trim() && !password) return null;
  let email;
  try {
    email = cleanEmail(rawEmail);
  } catch {
    throw new Error('ADMIN_EMAIL isn’t a valid email address.');
  }
  const problem = passwordProblem(password);
  if (problem) throw new Error(`ADMIN_PASSWORD: ${problem}`);
  const existing = await User.findByEmail(email);
  if (existing) {
    return existing.is_admin ? null : `${email} (ADMIN_EMAIL) already has an account that isn’t an admin, so it was left as it is. If it’s the owner’s, run: npm run admin -- ${email}`;
  }
  const user = await User.create({ email, name: 'Store admin', passwordHash: await hashPassword(password) });
  await query('UPDATE users SET is_admin = TRUE WHERE id = ?', [user.id]);
  return `Created the admin account ${email} from ADMIN_EMAIL.`;
}
