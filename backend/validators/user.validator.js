import { HttpError } from '../utils/HttpError.js';

// The customer's full name: required, trimmed, and short enough for users.name.
export function cleanName(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name) throw new HttpError(400, 'Enter your full name.');
  if (name.length > 120) throw new HttpError(400, 'Use a name under 120 characters.');
  return name;
}

// PUT /api/me/preferences sends both switches, as the profile page keeps them.
export function cleanPreferences(body) {
  const { smsUpdates, offers } = body ?? {};
  if (typeof smsUpdates !== 'boolean' || typeof offers !== 'boolean') throw new HttpError(400, 'Send smsUpdates and offers as true or false.');
  return { smsUpdates, offers };
}
