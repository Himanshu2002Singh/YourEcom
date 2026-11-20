// The rules on their own, without a server or database: pricing, checkout input, passwords
// and session cookies.
import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { deliveryFeeFor, discountFor, gstFor } from '../services/pricing.service.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { readSession, startSession } from '../utils/session.js';
import { photoType } from '../utils/uploads.js';
import { cleanOrderQuery, cleanProduct, cleanStatusChange } from '../validators/admin.validator.js';
import { MAX_BULK_QUANTITY, MAX_QUANTITY, cleanCouponCode, cleanOrder, cleanStatus } from '../validators/order.validator.js';

before(() => {
  process.env.SESSION_SECRET = 'test-secret-that-is-long-enough-for-hmac-signing';
});

const order = ({ phone = '98765 43210', pincode = '110059', quantity = 1 } = {}) => ({
  items: [{ id: 1, quantity }],
  delivery: { name: ' Aarav Singh ', phone, address: '12 MG Road', city: 'New Delhi', pincode },
  paymentMethod: 'cod',
});

test('delivery is free from a ₹2,500 subtotal and ₹99 below it', () => {
  assert.equal(deliveryFeeFor(2499), 99);
  assert.equal(deliveryFeeFor(2500), 0);
});

test('GST on a bulk order is rounded to the nearest rupee', () => {
  assert.equal(gstFor(2500, 12), 300);
  assert.equal(gstFor(555, 5), 28, '₹27.75');
  assert.equal(gstFor(185, 18), 33, '₹33.30');
  assert.equal(gstFor(1000, 0), 0);
});

test('checkout input is trimmed, retail quantities go up to 999, bulk ones past it, and a line is retail unless it says bulk', () => {
  assert.deepEqual(cleanOrder(order({ quantity: MAX_QUANTITY })), {
    items: [{ id: 1, quantity: 999, bulk: false }],
    delivery: { name: 'Aarav Singh', phone: '98765 43210', address: '12 MG Road', city: 'New Delhi', pincode: '110059' },
    paymentMethod: 'cod',
    couponCode: null,
  });
  assert.deepEqual(cleanOrder({ ...order(), items: [{ id: 1, quantity: 10, bulk: true }, { id: 2, quantity: 1, bulk: false }] }).items, [
    { id: 1, quantity: 10, bulk: true },
    { id: 2, quantity: 1, bulk: false },
  ]);
  assert.throws(() => cleanOrder(order({ quantity: 1.5 })), { status: 400 });
  assert.throws(() => cleanOrder(order({ quantity: MAX_QUANTITY + 1 })), { status: 400, message: 'Quantity must be between 1 and 999.' }, 'retail stops at 999');
  const bulkLine = quantity => cleanOrder({ ...order(), items: [{ id: 1, quantity, bulk: true }] }).items[0].quantity;
  assert.equal(bulkLine(25_000), 25_000, 'a bulk order is limited only by the stock');
  assert.equal(bulkLine(MAX_BULK_QUANTITY), MAX_BULK_QUANTITY);
  assert.throws(() => bulkLine(MAX_BULK_QUANTITY + 1), { status: 400, message: 'Quantity must be between 1 and 10,00,000.' });
  for (const bulk of ['true', 1, null]) assert.throws(() => cleanOrder({ ...order(), items: [{ id: 1, quantity: 10, bulk }] }), { status: 400 }, String(bulk));
});

test('a coupon takes a percentage (rounded down, up to its cap) or a flat amount, never more than the subtotal', () => {
  const welcome = { kind: 'percent', amount: 10, max_discount: 250 };
  assert.equal(discountFor(welcome, 899), 89);
  assert.equal(discountFor(welcome, 4000), 250);
  assert.equal(discountFor({ kind: 'percent', amount: 15, max_discount: null }, 1000), 150);
  assert.equal(discountFor({ kind: 'flat', amount: 100, max_discount: null }, 1500), 100);
  assert.equal(discountFor({ kind: 'flat', amount: 100, max_discount: null }, 60), 60);
});

test('coupon codes are trimmed and upper-cased, and only letters and digits', () => {
  assert.equal(cleanCouponCode(' welcome10 '), 'WELCOME10');
  assert.equal(cleanOrder({ ...order(), couponCode: 'save100' }).couponCode, 'SAVE100');
  for (const code of ['', 'SAVE 100', 'SAVE-100', 'A'.repeat(31), 42]) {
    assert.throws(() => cleanCouponCode(code), { status: 400 }, String(code));
  }
});

test('phone numbers and pincodes follow the checkout form', () => {
  for (const phone of ['9876543210', '98765-43210', '+91 98765 43210', '+919876543210', '09876543210']) {
    assert.equal(cleanOrder(order({ phone })).delivery.phone, phone);
  }
  for (const phone of ['5876543210', '987654321', '+1 9876543210', '98765  43210']) {
    assert.throws(() => cleanOrder(order({ phone })), { status: 400 }, phone);
  }
  for (const pincode of ['011005', '11005', '1100590', 'abcdef']) {
    assert.throws(() => cleanOrder(order({ pincode })), { status: 400 }, pincode);
  }
});

test('the order status filter is optional and only Processing, Shipped, Delivered or Cancelled', () => {
  assert.equal(cleanStatus(undefined), null);
  assert.equal(cleanStatus('Shipped'), 'Shipped');
  assert.equal(cleanStatus('Delivered'), 'Delivered');
  assert.equal(cleanStatus('Cancelled'), 'Cancelled');
  assert.throws(() => cleanStatus('delivered'), { status: 400 });
});

test('admins move orders on to Shipped (with tracking), Delivered or Cancelled, and nothing else', () => {
  assert.deepEqual(cleanStatusChange({ status: 'Shipped', tracking: ' DTDC 123 ' }), { status: 'Shipped', tracking: 'DTDC 123' });
  assert.deepEqual(cleanStatusChange({ status: 'Shipped', tracking: ' ' }), { status: 'Shipped', tracking: null });
  assert.deepEqual(cleanStatusChange({ status: 'Delivered', tracking: 'DTDC 123' }), { status: 'Delivered', tracking: null }, 'tracking only goes with Shipped');
  for (const body of [{ status: 'Processing' }, { status: 'shipped' }, {}, null, { status: 'Shipped', tracking: 'x'.repeat(201) }]) {
    assert.throws(() => cleanStatusChange(body), { status: 400 }, JSON.stringify(body));
  }
  assert.deepEqual(cleanOrderQuery({}), { status: null, search: '', page: 1, pageSize: 20 });
  assert.deepEqual(cleanOrderQuery({ status: 'Shipped', q: ' 98765 ', page: '3' }), { status: 'Shipped', search: '98765', page: 3, pageSize: 20 });
  for (const page of ['0', '-1', '1.5', 'x', ['1', '2']]) assert.throws(() => cleanOrderQuery({ page }), { status: 400 }, String(page));
});

test('a product needs a name, category, price no higher than its MRP, pack, description, a photo and a highlight', () => {
  const product = {
    name: ' Syringe, 2 ml ', category: 'Syringes', family: ' Syringe ', variant: ' 2 ml ', price: 280, mrp: 500, bulk: null, stock: 0, unit: ' Box of 100 ', badge: '',
    description: ' Sterile. ', photos: ['/photos/syringe-2ml.jpg', '/api/uploads/0a1b2c3d4e5f60718293a4b5.webp'], features: [' Sterile ', ''], specs: [[' Needle ', ' None '], ['', '']],
  };
  assert.deepEqual(cleanProduct(product), {
    name: 'Syringe, 2 ml', category: 'Syringes', family: 'Syringe', variant: '2 ml', price: 280, mrp: 500, bulk_price: null, bulk_min_qty: null, gst_rate: null, stock: 0,
    unit: 'Box of 100', badge: null, description: 'Sterile.', image: '/photos/syringe-2ml.jpg', gallery: ['/api/uploads/0a1b2c3d4e5f60718293a4b5.webp'], features: ['Sterile'],
    specs: [['Needle', 'None']],
  });
  const bulk = { price: 250, minQuantity: 10, gstRate: 5 };
  assert.deepEqual(Object.entries(cleanProduct({ ...product, bulk })).filter(([column]) => /bulk|gst/.test(column)), [['bulk_price', 250], ['bulk_min_qty', 10], ['gst_rate', 5]]);
  assert.equal(cleanProduct({ ...product, mrp: null, bulk: { ...bulk, price: 5000 } }).bulk_price, 5000, 'no MRP, no ceiling');
  const invalidBulk = [
    undefined, 'yes', [bulk], { ...bulk, price: 0 }, { ...bulk, price: 249.5 }, { ...bulk, gstRate: -1 }, { ...bulk, gstRate: 41 }, { ...bulk, gstRate: '5' }, { ...bulk, minQuantity: 0 },
    { ...bulk, minQuantity: MAX_BULK_QUANTITY + 1 }, { ...bulk, price: 477, gstRate: 5 },
  ];
  for (const terms of invalidBulk) assert.throws(() => cleanProduct({ ...product, bulk: terms }), { status: 400 }, `${JSON.stringify(terms)} (₹477 + 5% is above the ₹500 MRP)`);
  assert.equal(cleanProduct({ ...product, bulk: { ...bulk, price: 476 } }).bulk_price, 476, '₹476 + 5% is ₹499.80, under the MRP');
  assert.equal(cleanProduct({ ...product, stock: 50_000, bulk: { ...bulk, minQuantity: 5000 } }).bulk_min_qty, 5000, 'a bulk minimum may pass 999');
  assert.equal(cleanProduct({ ...product, mrp: 280 }).mrp, 280, 'MRP may equal the price');
  assert.equal(cleanProduct({ ...product, mrp: null }).mrp, null);
  assert.deepEqual(Object.values(cleanProduct({ ...product, family: ' ', variant: '' })).slice(2, 4), [null, null], 'a product in one size has neither');
  assert.equal(cleanProduct({ ...product, category: '  Wound   Care ' }).category, 'Wound Care', 'a new category, spaced once');
  const invalid = [
    { name: ' ' }, { category: ' ' }, { category: 'x'.repeat(61) }, { category: 7 }, { variant: '' }, { price: 0 }, { price: '280' }, { mrp: 279 }, { mrp: undefined }, { stock: -1 }, { stock: 0.5 },
    { unit: '' }, { description: '  ' }, { badge: 'x'.repeat(41) }, { photos: [] }, { photos: ['https://example.com/x.jpg'] }, { photos: ['/photos/../../.env'] },
    { photos: ['/photos/a.svg'] }, { photos: ['/photos/a.jpg', '/photos/a.jpg'] }, { features: [' '] }, { features: 'Sterile' }, { specs: [['Needle', '']] },
  ];
  for (const change of invalid) assert.throws(() => cleanProduct({ ...product, ...change }), { status: 400 }, JSON.stringify(change));
});

test('only JPEG, PNG and WebP files count as photos, whatever they are called', () => {
  assert.equal(photoType(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'jpg');
  assert.equal(photoType(Buffer.from('89504e470d0a1a0a00', 'hex')), 'png');
  assert.equal(photoType(Buffer.from('RIFF\0\0\0\0WEBPVP8 ', 'latin1')), 'webp');
  for (const other of ['<svg xmlns="http://www.w3.org/2000/svg"/>', 'GIF89a', '']) assert.equal(photoType(Buffer.from(other)), null, other);
});

test('passwords are hashed with a salt and verified', async () => {
  const stored = await hashPassword('first-password');
  assert.notEqual(stored, await hashPassword('first-password'));
  assert.equal(await verifyPassword('first-password', stored), true);
  assert.equal(await verifyPassword('wrong-password', stored), false);
});

test('a session cookie counts only with its own signature', () => {
  let header;
  startSession({ secure: false }, { setHeader: (name, value) => (header = value) }, { id: 'user-1' });
  const cookie = header.split(';')[0];
  assert.equal(readSession({ headers: { cookie } }).uid, 'user-1');
  const forged = Buffer.from(JSON.stringify({ uid: 'someone-else', exp: Date.now() + 864e5 })).toString('base64url');
  assert.equal(readSession({ headers: { cookie: `ye_session=${forged}.${cookie.split('.')[1]}` } }), null);
});
