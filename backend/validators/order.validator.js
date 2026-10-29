import { HttpError } from '../utils/HttpError.js';

// The storefront's rules: frontend/src/lib/cart.ts (quantities) and
// frontend/src/pages/CheckoutPage.tsx (delivery details).
export const MAX_QUANTITY = 999;
const MAX_LINES = 50;
const PAYMENT_METHODS = ['online', 'cod'];
const STATUSES = ['Processing', 'Delivered', 'Cancelled'];
const PHONE = /^(\+91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/;
const PINCODE = /^[1-9]\d{5}$/;
const COUPON_CODE = /^[A-Z0-9]{1,30}$/;

const text = value => (typeof value === 'string' ? value.trim() : '');

// A coupon code as typed, in any case: trimmed and upper-cased. Whether the code exists is up to
// models/coupon.model.js.
export function cleanCouponCode(code) {
  const clean = text(code).toUpperCase();
  if (!COUPON_CODE.test(clean)) throw new HttpError(400, 'Coupon codes are letters and numbers only. Check it and try again.');
  return clean;
}

// Cart lines as the storefront keeps them: [{ id, quantity }]. Nothing else on a line is
// read; prices come from the database (services/pricing.service.js).
function cleanItems(items) {
  if (!Array.isArray(items) || !items.length) throw new HttpError(400, 'Your cart is empty.');
  if (items.length > MAX_LINES) throw new HttpError(400, `An order can have up to ${MAX_LINES} different products.`);
  const ids = new Set();
  return items.map(item => {
    const { id, quantity } = item ?? {};
    if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'Each item needs the id of a product.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) throw new HttpError(400, `Quantity must be between 1 and ${MAX_QUANTITY}.`);
    if (ids.has(id)) throw new HttpError(400, 'List each product once, with its full quantity.');
    ids.add(id);
    return { id, quantity };
  });
}

// Trimmed delivery details, checked the way the checkout form checks them.
function cleanDelivery(delivery) {
  const { name, phone, address, city, pincode } = delivery ?? {};
  const clean = { name: text(name), phone: text(phone), address: text(address), city: text(city), pincode: text(pincode) };
  if (!clean.name) throw new HttpError(400, 'Enter the name of the person receiving the order.');
  if (!PHONE.test(clean.phone)) throw new HttpError(400, 'Enter a valid 10-digit mobile number.');
  if (clean.address.length < 5) throw new HttpError(400, 'Enter the full delivery address.');
  if (!clean.city) throw new HttpError(400, 'Enter the city.');
  if (!PINCODE.test(clean.pincode)) throw new HttpError(400, 'Enter a valid 6-digit pincode.');
  if (clean.name.length > 120 || clean.address.length > 500 || clean.city.length > 100) throw new HttpError(400, 'Shorten the delivery details.');
  return clean;
}

// POST /api/orders { items, delivery, paymentMethod, couponCode? }. couponCode is null without one.
export function cleanOrder(body) {
  const { items, delivery, paymentMethod, couponCode } = body ?? {};
  const order = { items: cleanItems(items), delivery: cleanDelivery(delivery), paymentMethod, couponCode: couponCode == null ? null : cleanCouponCode(couponCode) };
  if (!PAYMENT_METHODS.includes(paymentMethod)) throw new HttpError(400, 'Choose online payment or cash on delivery.');
  return order;
}

// The optional ?status= filter of GET /api/orders.
export function cleanStatus(status = '') {
  if (status && !STATUSES.includes(status)) throw new HttpError(400, `Status must be ${STATUSES.slice(0, -1).join(', ')} or ${STATUSES.at(-1)}.`);
  return status || null;
}
