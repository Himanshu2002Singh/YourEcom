import { HttpError } from '../utils/HttpError.js';

const MAX_COMMENT = 1000;

// PUT /api/products/:id/reviews { rating: 1–5, comment? } — the comment is optional.
export function cleanReview(body) {
  const { rating, comment = '' } = body ?? {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'Choose a rating from 1 to 5 stars.');
  if (typeof comment !== 'string') throw new HttpError(400, 'Write your review as text.');
  const text = comment.trim();
  if (text.length > MAX_COMMENT) throw new HttpError(400, 'Keep your review under 1,000 characters.');
  return { rating, comment: text };
}
