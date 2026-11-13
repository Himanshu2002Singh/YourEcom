import { HttpError } from '../utils/HttpError.js';
import { cleanStatus } from './order.validator.js';

// Input to the admin pages' API (routes/admin.routes.js).
export const ORDERS_PAGE_SIZE = 20;

const text = value => (typeof value === 'string' ? value.trim() : '');

// GET /api/admin/orders?status=Processing&q=98765&page=2 — every filter is optional.
export function cleanOrderQuery({ status, q, page = '1' }) {
  if (!/^[1-9]\d{0,5}$/.test(page)) throw new HttpError(400, 'Page must be a whole number from 1.');
  return { status: cleanStatus(status), search: text(q).slice(0, 100), page: Number(page), pageSize: ORDERS_PAGE_SIZE };
}

// PUT /api/admin/orders/:id/status { status, tracking? }. Tracking (courier and tracking number) is kept only
// with Shipped, and an empty one is null.
export function cleanStatusChange(body) {
  const { status, tracking } = body ?? {};
  if (!['Shipped', 'Delivered', 'Cancelled'].includes(status)) throw new HttpError(400, 'Status must be Shipped, Delivered or Cancelled.');
  const note = text(tracking);
  if (note.length > 200) throw new HttpError(400, 'Keep the courier and tracking number under 200 characters.');
  return { status, tracking: status === 'Shipped' && note ? note : null };
}
