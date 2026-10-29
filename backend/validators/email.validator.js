import { HttpError } from '../utils/HttpError.js';

// Same pattern as the storefront's sign-in form (frontend/src/pages/LoginPage.tsx).
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lower-cased, trimmed email, or a 400 the form can show as-is.
export function cleanEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) throw new HttpError(400, 'Enter a valid email address.');
  return email;
}
