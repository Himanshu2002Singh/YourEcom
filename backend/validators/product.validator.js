import { HttpError } from '../utils/HttpError.js';

// The storefront's categories (frontend/src/data/categories.ts). Every product is in one of them.
export const CATEGORIES = ['Syringes', 'Needles', 'IV Sets', 'Face Masks', 'Gloves', 'Bandages', 'Gauze & Cotton'];
const MAX_SEARCH = 100;

// GET /api/products?category=Gloves&q=nitrile — both filters are optional.
export function cleanProductQuery({ category = '', q = '' }) {
  if (category && !CATEGORIES.includes(category)) throw new HttpError(400, `Choose a category: ${CATEGORIES.join(', ')}.`);
  return { category: category || null, search: typeof q === 'string' ? q.trim().slice(0, MAX_SEARCH) : '' };
}
