// Calls the YourEcom API (backend/) on this site's own /api path; in development Vite passes
// those requests on to the backend (vite.config.ts). The session is an HttpOnly cookie, so
// the browser sends it with every request by itself.
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Options = { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown };

// Resolves with the JSON the API answers, or rejects with an ApiError whose message can be shown as-is.
export async function api<T>(path: string, { method = 'GET', body }: Options = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Can’t reach YourEcom right now. Check your connection and try again.', 0);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) throw new ApiError(data?.error ?? 'Something went wrong on our side. Try again in a moment.', response.status);
  return data as T;
}
