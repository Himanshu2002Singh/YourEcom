import { HttpError } from '../utils/HttpError.js';

// A category is whatever its products say: the store's own and any an admin adds with a product. The
// products.category column holds up to 60 characters.
export const MAX_CATEGORY = 60;
const MAX_SEARCH = 100;

// GET /api/products?category=Gloves&q=nitrile — both filters are optional. A category with no products
// simply finds none.
export function cleanProductQuery({ category = '', q = '' }) {
  if (typeof category !== 'string' || category.length > MAX_CATEGORY) throw new HttpError(400, `Use a category name of up to ${MAX_CATEGORY} characters.`);
  return { category: category.trim() || null, search: typeof q === 'string' ? q.trim().slice(0, MAX_SEARCH) : '' };
}
