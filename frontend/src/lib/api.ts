import { PHONE } from '@/data/contact';

// Calls the YourEcom API (backend/) on this site's own /api path; in development Vite passes
// those requests on to the backend (vite.config.ts). The session is an HttpOnly cookie, so
// the browser sends it with every request by itself.

// The Vercel site is built without an API until the backend is hosted (VITE_NO_API in vercel.json):
// it shows a copy of the catalogue, and anything that needs the API says ordering isn't open yet.
export const NO_API = import.meta.env.VITE_NO_API === 'true';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Options = { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown };

// A body is sent as JSON, except FormData (photo uploads), which the browser sends as multipart with its own
// Content-Type. The API only takes multipart with X-Requested-With, which a form on another site can't add.
function request(body: unknown): Pick<RequestInit, 'headers' | 'body'> {
  if (body === undefined) return {};
  if (body instanceof FormData) return { headers: { 'X-Requested-With': 'fetch' }, body };
  return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

// Resolves with the JSON the API answers, or rejects with an ApiError whose message can be shown as-is.
export async function api<T>(path: string, { method = 'GET', body }: Options = {}): Promise<T> {
  if (NO_API) throw new ApiError(`Online ordering isn’t open yet. To order, call or WhatsApp us on ${PHONE}.`, 0);
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { method, ...request(body) });
  } catch {
    throw new ApiError('Can’t reach YourEcom right now. Check your connection and try again.', 0);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) throw new ApiError(data?.error ?? 'Something went wrong on our side. Try again in a moment.', response.status);
  return data as T;
}
