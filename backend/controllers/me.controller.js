// /api/me — the signed-in customer's profile, password and preferences.
import * as User from '../models/user.model.js';
import { HttpError } from '../utils/HttpError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { startSession } from '../utils/session.js';
import { passwordProblem } from '../validators/password.validator.js';
import { cleanName, cleanPreferences } from '../validators/user.validator.js';
import { userView } from '../views/user.view.js';

// Answers { user: null } when signed out, so the app can tell "signed out" from an error.
export function getProfile(request, response) {
  const { user } = request;
  response.json({ user: user ? userView(user) : null });
}

// PUT /api/me { name }
export async function saveName(request, response) {
  const user = await User.updateName(request.user.id, cleanName(request.body.name));
  response.json({ user: userView(user) });
}

// PUT /api/me/password { currentPassword, newPassword }. Every other browser is signed out;
// this one gets a fresh session cookie.
export async function changePassword(request, response) {
  const { currentPassword, newPassword } = request.body;
  if (!await verifyPassword(String(currentPassword ?? ''), request.user.password_hash)) throw new HttpError(400, 'Your current password is incorrect.');
  const problem = passwordProblem(newPassword);
  if (problem) throw new HttpError(400, problem);
  if (newPassword === currentPassword) throw new HttpError(400, 'Choose a new password that’s different from your current one.');
  const user = await User.updatePassword(request.user.id, await hashPassword(newPassword));
  startSession(request, response, user);
  response.json({ user: userView(user) });
}

// PUT /api/me/preferences { smsUpdates, offers }
export async function savePreferences(request, response) {
  const user = await User.updatePreferences(request.user.id, cleanPreferences(request.body));
  response.json({ user: userView(user) });
}
