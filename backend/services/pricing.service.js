// Prices an order from the products table, never from what the browser sends.
// Same rules as the storefront (frontend/src/lib/pricing.ts).
import * as Product from '../models/product.model.js';
import { HttpError } from '../utils/HttpError.js';

export const FREE_DELIVERY_THRESHOLD = 2500;
export const DELIVERY_FEE = 99; // a placeholder until the real fee is confirmed

// Delivery goes by the subtotal before any coupon, so a coupon never brings back the fee.
export const deliveryFeeFor = subtotal => (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE);

// What a coupon row (models/coupon.model.js) takes off a subtotal: a percentage rounded down to
// whole rupees and capped at max_discount, or a flat amount; never more than the subtotal.
export function discountFor(coupon, subtotal) {
  const off = coupon.kind === 'percent' ? Math.floor((subtotal * coupon.amount) / 100) : coupon.amount;
  return Math.min(off, coupon.max_discount ?? off, subtotal);
}

const rupees = amount => `₹${amount.toLocaleString('en-IN')}`;

// lines: [{ id, quantity }] from validators/order.validator.js; coupon: a row the customer may
// use, or null. Returns each line as the snapshot an order keeps ({ id, name, price, unit,
// image, quantity }) and the totals.
export async function priceOrder(lines, coupon = null) {
  const products = new Map((await Product.findByIds(lines.map(line => line.id))).map(product => [product.id, product]));
  const items = lines.map(({ id, quantity }) => {
    const product = products.get(id);
    if (!product) throw new HttpError(400, 'A product in your cart is no longer sold. Remove it and try again.');
    return { id, name: product.name, price: product.price, unit: product.unit, image: product.image, quantity };
  });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (coupon && subtotal < coupon.min_subtotal) throw new HttpError(400, `${coupon.code} is for orders of ${rupees(coupon.min_subtotal)} or more.`);
  const discount = coupon ? discountFor(coupon, subtotal) : 0;
  const deliveryFee = deliveryFeeFor(subtotal);
  return { items, subtotal, discount, couponCode: coupon?.code ?? null, deliveryFee, total: subtotal - discount + deliveryFee };
}
