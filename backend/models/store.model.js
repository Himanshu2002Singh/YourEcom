// The store_info table: the store's own details, one JSON value per name (seeded by db/schema.js).
import { query } from '../db/pool.js';

// Every detail, as { name: value }.
export async function details() {
  const rows = await query('SELECT name, value FROM store_info');
  return Object.fromEntries(rows.map(row => [row.name, row.value]));
}
