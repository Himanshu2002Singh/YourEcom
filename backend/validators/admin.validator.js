import { HttpError } from '../utils/HttpError.js';
import { cleanStatus } from './order.validator.js';
import { CATEGORIES } from './product.validator.js';

// Input to the admin pages' API (routes/admin.routes.js).
export const ORDERS_PAGE_SIZE = 20;
const MAX_RUPEES = 10_000_000; // ₹1 crore, far above any pack
const MAX_STOCK = 1_000_000;
const MAX_PHOTOS = 10;
const MAX_FEATURES = 8;
const MAX_SPECS = 20;
// A photo already on the site (frontend/public/photos).
const PHOTO = /^\/photos\/[\w.-]+\.(jpe?g|png|webp)$/i;

const text = value => (typeof value === 'string' ? value.trim() : '');
const wholeNumber = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

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

// Highlights: the non-empty lines, 1 to 8 of them.
function cleanFeatures(features) {
  if (!Array.isArray(features)) throw new HttpError(400, 'Send the highlights as a list.');
  const lines = features.map(text).filter(Boolean);
  if (!lines.length) throw new HttpError(400, 'Add at least one highlight.');
  if (lines.length > MAX_FEATURES || lines.some(line => line.length > 120)) throw new HttpError(400, `Use up to ${MAX_FEATURES} highlights of up to 120 characters each.`);
  return lines;
}

// The details table: [label, value] rows, leaving out rows that are entirely empty.
function cleanSpecs(specs) {
  if (!Array.isArray(specs)) throw new HttpError(400, 'Send the specifications as a list of rows.');
  const rows = specs.map(row => (Array.isArray(row) ? [text(row[0]), text(row[1])] : ['', ''])).filter(([label, value]) => label || value);
  if (rows.some(([label, value]) => !label || !value)) throw new HttpError(400, 'Give every specification both a name and a value.');
  if (rows.length > MAX_SPECS || rows.some(([label, value]) => label.length > 60 || value.length > 200)) {
    throw new HttpError(400, `Use up to ${MAX_SPECS} specifications, with names up to 60 and values up to 200 characters.`);
  }
  return rows;
}

// PUT /api/admin/products/:id: the whole product, as the product form sends it. Sizes of one product share
// a family (the name the storefront shows for them) and each has its own variant; a product in one size has
// neither. `photos` lists its photo URLs, main photo first. mrp is null when the pack has none, and may not be
// below the price, because nothing may be sold above its MRP. An empty badge is null.
export function cleanProduct(body) {
  const { name, category, family, variant, price, mrp, stock, unit, badge, description, photos, features, specs } = body ?? {};
  const product = { name: text(name), category, family: text(family) || null, variant: text(variant) || null, unit: text(unit), badge: text(badge) || null, description: text(description) };
  if (!product.name || product.name.length > 200) throw new HttpError(400, 'Enter the product’s name, in up to 200 characters.');
  if (!CATEGORIES.includes(category)) throw new HttpError(400, 'Choose one of the store’s categories.');
  if (Boolean(product.family) !== Boolean(product.variant)) throw new HttpError(400, 'A size needs both the range it belongs to and its own size, such as 2 ml.');
  if (product.family?.length > 120 || product.variant?.length > 40) throw new HttpError(400, 'Keep the range name under 120 characters and the size under 40.');
  if (!wholeNumber(price, 1, MAX_RUPEES)) throw new HttpError(400, 'Price must be a whole number of rupees, at least ₹1.');
  if (mrp !== null && !wholeNumber(mrp, price, MAX_RUPEES)) throw new HttpError(400, 'MRP must be a whole number of rupees and no lower than the price, or left empty.');
  if (!wholeNumber(stock, 0, MAX_STOCK)) throw new HttpError(400, 'Stock must be a whole number, 0 or more.');
  if (!product.unit || product.unit.length > 60) throw new HttpError(400, 'Enter the pack, such as Box of 100, in up to 60 characters.');
  if (product.badge?.length > 40) throw new HttpError(400, 'Keep the badge under 40 characters.');
  if (!product.description || product.description.length > 1000) throw new HttpError(400, 'Enter a description of up to 1,000 characters.');
  if (!Array.isArray(photos) || !photos.length) throw new HttpError(400, 'Add at least one photo.');
  if (photos.length > MAX_PHOTOS) throw new HttpError(400, `Use up to ${MAX_PHOTOS} photos.`);
  if (!photos.every(photo => typeof photo === 'string' && PHOTO.test(photo)) || new Set(photos).size !== photos.length) {
    throw new HttpError(400, 'Use photos already on the site, each once.');
  }
  return { ...product, price, mrp, stock, image: photos[0], gallery: photos.slice(1), features: cleanFeatures(features), specs: cleanSpecs(specs) };
}
