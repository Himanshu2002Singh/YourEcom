// Prices an order from the products table, never from what the browser sends.
// Same rules as the storefront (frontend/src/lib/pricing.ts).
import * as Product from '../models/product.model.js';
import { HttpError } from '../utils/HttpError.js';

export const FREE_DELIVERY_THRESHOLD = 2500;
export const DELIVERY_FEE = 99; // a placeholder until the real fee is confirmed

// Delivery goes by the goods (with any GST) before a coupon, so a coupon never brings back the fee.
export const deliveryFeeFor = goods => (goods >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE);

// What a coupon row (models/coupon.model.js) takes off a subtotal: a percentage rounded down to
// whole rupees and capped at max_discount, or a flat amount; never more than the subtotal.
export function discountFor(coupon, subtotal) {
  const off = coupon.kind === 'percent' ? Math.floor((subtotal * coupon.amount) / 100) : coupon.amount;
  return Math.min(off, coupon.max_discount ?? off, subtotal);
}

// The GST on an amount before tax at `rate` percent, to the nearest rupee.
export const gstFor = (amount, rate) => Math.round((amount * rate) / 100);

const rupees = amount => `₹${amount.toLocaleString('en-IN')}`;

// One cart line as the order keeps it: { id, name, price, unit, image, quantity, bulk, gstRate, gst }. Retail is
// the product's price, which includes GST. A bulk order is the bulk price a pack with GST added on top (gst), and
// needs at least the product's smallest bulk order.
function priceLine(product, { id, quantity, bulk }) {
  if (!product) throw new HttpError(400, 'A product in your cart is no longer sold. Remove it and try again.');
  const line = { id, name: product.name, unit: product.unit, image: product.image, quantity };
  if (!bulk) return { ...line, price: product.price, bulk: false, gstRate: null, gst: 0 };
  if (product.bulk_price === null) throw new HttpError(400, `${product.name} isn’t sold in bulk any more. Change it to a retail order in your cart.`);
  if (quantity < product.bulk_min_qty) throw new HttpError(400, `A bulk order of ${product.name} is at least ${product.bulk_min_qty} × ${product.unit}.`);
  return { ...line, price: product.bulk_price, bulk: true, gstRate: product.gst_rate, gst: gstFor(product.bulk_price * quantity, product.gst_rate) };
}

// lines: [{ id, quantity, bulk }] from validators/order.validator.js; coupon: a row the customer may use, or null.
// A coupon is for the retail items only: bulk prices are already the wholesale rate. Returns the lines (priceLine)
// and the totals.
export async function priceOrder(lines, coupon = null) {
  const products = new Map((await Product.findByIds(lines.map(line => line.id))).map(product => [product.id, product]));
  const items = lines.map(line => priceLine(products.get(line.id), line));
  const sum = (list, amount) => list.reduce((total, item) => total + amount(item), 0);
  const subtotal = sum(items, item => item.price * item.quantity);
  const retail = sum(items.filter(item => !item.bulk), item => item.price * item.quantity);
  const gst = sum(items, item => item.gst);
  if (coupon && retail === 0) throw new HttpError(400, `${coupon.code} is for retail items. Bulk orders already have the wholesale rate.`);
  if (coupon && retail < coupon.min_subtotal) {
    throw new HttpError(400, `${coupon.code} is for orders of ${rupees(coupon.min_subtotal)} or more${retail < subtotal ? ' in retail items' : ''}.`);
  }
  const discount = coupon ? discountFor(coupon, retail) : 0;
  const deliveryFee = deliveryFeeFor(subtotal + gst);
  return { items, subtotal, discount, couponCode: coupon?.code ?? null, gst, deliveryFee, total: subtotal - discount + gst + deliveryFee };
}
