// "Sign in with Google". The storefront shows Google's button for this site's OAuth client (GOOGLE_CLIENT_ID);
// Google hands the browser an ID token (a signed JWT), which the browser posts to /api/auth/google. Google's
// own library checks the token's signature against Google's published keys, and its issuer, audience and expiry.
import { OAuth2Client } from 'google-auth-library';
import { HttpError } from './HttpError.js';

let client;

// The OAuth client ID, or null when this server has no Google sign-in set up.
export const googleClientId = () => process.env.GOOGLE_CLIENT_ID || null;

// Resolves with { googleId, email, name } from a valid ID token for this site whose email Google has verified.
export async function verifyGoogleCredential(credential) {
  const audience = googleClientId();
  if (!audience) throw new HttpError(503, 'Google sign-in isn’t set up on this server yet.');
  // A JWT is three base64url parts; anything else is refused before asking Google for its keys.
  if (typeof credential !== 'string' || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(credential)) throw new HttpError(401, 'Google sign-in didn’t work. Try again.');
  let payload;
  try {
    client ??= new OAuth2Client();
    payload = (await client.verifyIdToken({ idToken: credential, audience })).getPayload();
  } catch {
    throw new HttpError(401, 'Google sign-in didn’t work. Try again.');
  }
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new HttpError(401, 'Your Google account’s email address isn’t verified, so it can’t be used to sign in.');
  }
  const email = payload.email.toLowerCase();
  const name = String(payload.name ?? '').trim().slice(0, 120) || email.split('@')[0];
  return { googleId: payload.sub, email, name };
}
