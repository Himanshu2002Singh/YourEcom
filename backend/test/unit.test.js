// The rules on their own, without a server or database: pricing, checkout input, passwords
// and session cookies.
import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { deliveryFeeFor, discountFor } from '../services/pricing.service.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { readSession, startSession } from '../utils/session.js';
import { photoType } from '../utils/uploads.js';
import { cleanOrderQuery, cleanProduct, cleanStatusChange } from '../validators/admin.validator.js';
import { MAX_QUANTITY, cleanCouponCode, cleanOrder, cleanStatus } from '../validators/order.validator.js';

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

test('checkout input is trimmed, and quantities go up to 999', () => {
  assert.deepEqual(cleanOrder(order({ quantity: MAX_QUANTITY })), {
    items: [{ id: 1, quantity: 999 }],
    delivery: { name: 'Aarav Singh', phone: '98765 43210', address: '12 MG Road', city: 'New Delhi', pincode: '110059' },
    paymentMethod: 'cod',
    couponCode: null,
  });
  assert.throws(() => cleanOrder(order({ quantity: 1.5 })), { status: 400 });
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
    name: ' Syringe, 2 ml ', category: 'Syringes', family: ' Syringe ', variant: ' 2 ml ', price: 280, mrp: 500, stock: 0, unit: ' Box of 100 ', badge: '',
    description: ' Sterile. ', photos: ['/photos/syringe-2ml.jpg', '/api/uploads/0a1b2c3d4e5f60718293a4b5.webp'], features: [' Sterile ', ''], specs: [[' Needle ', ' None '], ['', '']],
  };
  assert.deepEqual(cleanProduct(product), {
    name: 'Syringe, 2 ml', category: 'Syringes', family: 'Syringe', variant: '2 ml', price: 280, mrp: 500, stock: 0, unit: 'Box of 100', badge: null,
    description: 'Sterile.', image: '/photos/syringe-2ml.jpg', gallery: ['/api/uploads/0a1b2c3d4e5f60718293a4b5.webp'], features: ['Sterile'], specs: [['Needle', 'None']],
  });
  assert.equal(cleanProduct({ ...product, mrp: 280 }).mrp, 280, 'MRP may equal the price');
  assert.equal(cleanProduct({ ...product, mrp: null }).mrp, null);
  assert.deepEqual(Object.values(cleanProduct({ ...product, family: ' ', variant: '' })).slice(2, 4), [null, null], 'a product in one size has neither');
  const invalid = [
    { name: ' ' }, { category: 'Toys' }, { variant: '' }, { price: 0 }, { price: '280' }, { mrp: 279 }, { mrp: undefined }, { stock: -1 }, { stock: 0.5 },
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
