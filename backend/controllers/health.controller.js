// GET /api/health — { ok: true } while the API is up and can reach its database.
import { query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';

export async function health(request, response) {
  try {
    await query('SELECT 1');
  } catch (error) {
    if (error instanceof HttpError) throw error; // DATABASE_URL isn't set
    console.error(error);
    throw new HttpError(503, 'The database isn’t reachable.');
  }
  response.json({ ok: true });
}
