import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from './HttpError.js';

// Sessions are a signed, HttpOnly cookie carrying the customer's user id and session_version.
// A password change raises the version, which ends every session made before it.
const COOKIE = 'ye_session';
const SESSION_DAYS = 30;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new HttpError(503, 'Accounts aren’t set up on this server yet.');
  return value;
}

function sign(payload) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

// Behind a proxy (Vercel, Render) Express reports https via `trust proxy`; locally it's plain http.
function secure(request) {
  return request.secure || process.env.NODE_ENV === 'production';
}

// The session cookie's value from the Cookie header ('' when there is none).
function sessionCookie(request) {
  for (const part of String(request.headers.cookie ?? '').split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === COOKIE) return value.join('=');
  }
  return '';
}

function setCookie(request, response, value, maxAge) {
  response.setHeader('Set-Cookie', [
    `${COOKIE}=${value}`,
    'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`,
    ...(secure(request) ? ['Secure'] : []),
  ].join('; '));
}

export function startSession(request, response, user) {
  const payload = Buffer.from(JSON.stringify({ uid: user.id, v: user.session_version, exp: Date.now() + SESSION_DAYS * 864e5 })).toString('base64url');
  setCookie(request, response, `${payload}.${sign(payload)}`, SESSION_DAYS * 86400);
}

export function endSession(request, response) {
  setCookie(request, response, '', 0);
}

// Returns { uid, v } from a valid, unexpired session cookie, or null.
export function readSession(request) {
  const [payload, signature] = sessionCookie(request).split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}
