// /api/auth/* — email + password accounts: register, sign in and sign out.
import * as User from '../models/user.model.js';
import { HttpError } from '../utils/HttpError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { endSession, startSession } from '../utils/session.js';
import { cleanEmail } from '../validators/email.validator.js';
import { passwordProblem } from '../validators/password.validator.js';
import { cleanName } from '../validators/user.validator.js';
import { userView } from '../views/user.view.js';

// POST /api/auth/register { name, email, password } — creates the account and signs it in.
export async function register(request, response) {
  const name = cleanName(request.body.name);
  const email = cleanEmail(request.body.email);
  const problem = passwordProblem(request.body.password);
  if (problem) throw new HttpError(400, problem);
  const user = await User.create({ email, name, passwordHash: await hashPassword(request.body.password) });
  startSession(request, response, user);
  response.status(201).json({ user: userView(user) });
}

// POST /api/auth/login { email, password }
export async function login(request, response) {
  const email = cleanEmail(request.body.email);
  const user = await User.findByEmail(email);
  if (!user || !await verifyPassword(String(request.body.password ?? ''), user.password_hash)) {
    throw new HttpError(401, 'Email or password is incorrect.');
  }
  startSession(request, response, user);
  response.json({ user: userView(user) });
}

export function logout(request, response) {
  endSession(request, response);
  response.json({ ok: true });
}
