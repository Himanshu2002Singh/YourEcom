// Prices an order from the products table, never from what the browser sends.
// Same rules as the storefront (frontend/src/lib/pricing.ts).
import * as Product from '../models/product.model.js';
import { HttpError } from '../utils/HttpError.js';

export const FREE_DELIVERY_THRESHOLD = 2500;
export const DELIVERY_FEE = 99; // a placeholder until the real fee is confirmed

export const deliveryFeeFor = subtotal => (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE);

// lines: [{ id, quantity }] from validators/order.validator.js. Returns each line as the
// snapshot an order keeps ({ id, name, price, unit, image, quantity }) and the totals.
export async function priceOrder(lines) {
  const products = new Map((await Product.findByIds(lines.map(line => line.id))).map(product => [product.id, product]));
  const items = lines.map(({ id, quantity }) => {
    const product = products.get(id);
    if (!product) throw new HttpError(400, 'A product in your cart is no longer sold. Remove it and try again.');
    return { id, name: product.name, price: product.price, unit: product.unit, image: product.image, quantity };
  });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = deliveryFeeFor(subtotal);
  return { items, subtotal, deliveryFee, total: subtotal + deliveryFee };
}
