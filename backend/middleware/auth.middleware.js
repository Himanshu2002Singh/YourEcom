import * as User from '../models/user.model.js';
import { HttpError } from '../utils/HttpError.js';
import { readSession } from '../utils/session.js';

// The signed-in customer from the session cookie, or null. A cookie from before the latest
// password change no longer counts (cookies from before versions existed count as version 0).
async function sessionUser(request) {
  const session = readSession(request);
  const user = session && await User.findById(session.uid);
  return user && user.session_version === (session.v ?? 0) ? user : null;
}

// Puts the customer (or null when signed out) on request.user.
export async function loadUser(request, response, next) {
  request.user = await sessionUser(request);
  next();
}

// Same, but answers 401 when nobody is signed in.
export async function requireUser(request, response, next) {
  request.user = await sessionUser(request);
  if (!request.user) throw new HttpError(401, 'Sign in to continue.');
  next();
}
