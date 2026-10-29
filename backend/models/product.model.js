// The products table: the catalogue the storefront sells (seeded by db/schema.js).
import { query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';

// Products with their review summary: rating (the average, NULL with no reviews) and review_count.
const WITH_RATINGS = `
  SELECT products.*, ratings.rating, COALESCE(ratings.review_count, 0) AS review_count
  FROM products LEFT JOIN (
    SELECT product_id, ROUND(AVG(rating), 1) AS rating, COUNT(*) AS review_count FROM reviews GROUP BY product_id
  ) AS ratings ON ratings.product_id = products.id`;

// Every product, or only those in `category` and/or whose name, category or description
// contains `search` (ignoring case), like the storefront's search box. Ordered by id.
export async function list({ category, search }) {
  const where = [];
  const params = [];
  if (category) {
    where.push('products.category = ?');
    params.push(category);
  }
  if (search) {
    const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`; // % and _ in the search are plain characters
    where.push('(products.name LIKE ? OR products.category LIKE ? OR products.description LIKE ?)');
    params.push(pattern, pattern, pattern);
  }
  return query(`${WITH_RATINGS}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY products.id`, params);
}

export async function findById(id) {
  return (await query(`${WITH_RATINGS} WHERE products.id = ?`, [id]))[0] ?? null;
}

// The product a URL names (/products/:id), or a 404.
export async function findFromParam(id) {
  const product = /^[1-9]\d{0,8}$/.test(id) ? await findById(Number(id)) : null;
  if (!product) throw new HttpError(404, 'Product not found.');
  return product;
}

export async function findByIds(ids) {
  if (!ids.length) return [];
  return query(`SELECT * FROM products WHERE id IN (${ids.map(() => '?').join(', ')})`, ids);
}
