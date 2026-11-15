// The products table: the catalogue the storefront sells (seeded by db/schema.js, then run from the admin pages).
import { query, transaction } from '../db/pool.js';
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

// What the admin pages write: every column but id (validators/admin.validator.js cleans them). Lists are JSON.
const COLUMNS = ['name', 'category', 'family', 'variant', 'price', 'mrp', 'unit', 'stock', 'badge', 'image', 'gallery', 'description', 'features', 'specs'];
const LISTS = new Set(['gallery', 'features', 'specs']);
const values = product => COLUMNS.map(column => (LISTS.has(column) ? JSON.stringify(product[column]) : product[column]));

// A new product from the admin pages, numbered after the highest id. Locking the highest row first means
// two products added at once get different numbers. Answers the product as the storefront sees it.
export async function create(product) {
  const id = await transaction(async connection => {
    const [[{ next }]] = await connection.query('SELECT COALESCE(MAX(id), 0) + 1 AS next FROM products FOR UPDATE');
    await connection.execute(`INSERT INTO products (id, ${COLUMNS.join(', ')}) VALUES (?, ${COLUMNS.map(() => '?').join(', ')})`, [next, ...values(product)]);
    return next;
  });
  return findById(id);
}

// Saves the admin's version of a product that exists, every field at once. Answers the product as it is now.
export async function update(id, product) {
  await query(`UPDATE products SET ${COLUMNS.map(column => `${column} = ?`).join(', ')} WHERE id = ?`, [...values(product), id]);
  return findById(id);
}

export async function findByIds(ids) {
  if (!ids.length) return [];
  return query(`SELECT * FROM products WHERE id IN (${ids.map(() => '?').join(', ')})`, ids);
}
