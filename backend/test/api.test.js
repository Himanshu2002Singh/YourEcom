// HTTP tests against the real Express app. The "with database" suite runs only when
// DATABASE_URL is set (backend/.env) and uses throwaway accounts it deletes afterwards.
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import app from '../app.js';
import { closeDb, query } from '../db/pool.js';
import { UPLOAD_DIR } from '../utils/uploads.js';
import * as User from '../models/user.model.js';

let server;
let base;

before(async () => {
  process.env.SESSION_SECRET ||= 'test-secret-that-is-long-enough-for-hmac-signing';
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server.close();
  await closeDb();
});

function call(path, { method = 'GET', body, cookie, type = 'application/json' } = {}) {
  return fetch(`${base}${path}`, {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': type } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  }).then(async response => ({ status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] }));
}

const delivery = { name: 'Test Customer', phone: '98765 43210', address: '12 MG Road, Sector 5', city: 'New Delhi', pincode: '110059' };

describe('without a database', () => {
  test('signed-out /me answers user: null', async () => {
    assert.deepEqual(await call('/me'), { status: 200, body: { user: null }, cookie: undefined });
  });

  test('changes must be JSON (blocks cross-site form posts)', async () => {
    const result = await call('/auth/logout', { method: 'POST', body: 'x=1', type: 'application/x-www-form-urlencoded' });
    assert.equal(result.status, 415);
  });

  test('unknown API paths are a JSON 404', async () => {
    assert.equal((await call('/nope')).status, 404);
  });

  test('preferences and orders need a session', async () => {
    assert.equal((await call('/me/preferences', { method: 'PUT', body: { smsUpdates: false, offers: true } })).status, 401);
    assert.equal((await call('/me', { method: 'PUT', body: { name: 'New Name' } })).status, 401);
    assert.equal((await call('/me/password', { method: 'PUT', body: { currentPassword: 'a', newPassword: 'b' } })).status, 401);
    assert.equal((await call('/orders', { method: 'POST', body: { items: [{ id: 1, quantity: 1 }], delivery, paymentMethod: 'cod' } })).status, 401);
    assert.equal((await call('/orders')).status, 401);
    assert.equal((await call('/orders/YE00000000')).status, 401);
    assert.equal((await call('/orders/YE00000000/cancel', { method: 'POST', body: {} })).status, 401);
    assert.equal((await call('/coupons')).status, 401);
    assert.equal((await call('/coupons/WELCOME10')).status, 401);
    assert.equal((await call('/wishlist')).status, 401);
    assert.equal((await call('/wishlist/1', { method: 'PUT', body: {} })).status, 401);
    assert.equal((await call('/products/1/reviews', { method: 'PUT', body: { rating: 5 } })).status, 401);
  });

  test('the admin API needs a session', async () => {
    assert.equal((await call('/admin/summary')).status, 401);
    assert.equal((await call('/admin/orders')).status, 401);
    assert.equal((await call('/admin/orders/YE00000000')).status, 401);
    assert.equal((await call('/admin/orders/YE00000000/status', { method: 'PUT', body: { status: 'Shipped' } })).status, 401);
    assert.equal((await call('/admin/products/1', { method: 'PUT', body: {} })).status, 401);
    assert.equal((await call('/admin/products', { method: 'POST', body: {} })).status, 401);
    assert.equal((await call('/admin/uploads', { method: 'POST', body: {} })).status, 401);
  });

  test('uploads are the only multipart requests, and need X-Requested-With', async () => {
    const send = headers => fetch(`${base}/admin/uploads`, { method: 'POST', headers, body: new FormData() }).then(response => response.status);
    assert.equal(await send({}), 415, 'a form on another site can’t add the header');
    assert.equal(await send({ 'X-Requested-With': 'fetch' }), 401);
  });

  test('bad registration input is rejected before touching the database', async () => {
    const valid = { name: 'Test Customer', email: 'a@b.co', password: 'longenough' };
    for (const body of [{ ...valid, name: '  ' }, { ...valid, email: 'nope' }, { ...valid, password: '12345' }]) {
      assert.equal((await call('/auth/register', { method: 'POST', body })).status, 400, JSON.stringify(body));
    }
  });

  test('a forgotten-password request needs a valid email address', async () => {
    assert.equal((await call('/auth/forgot-password', { method: 'POST', body: { email: 'nope' } })).status, 400);
    assert.equal((await call('/auth/reset-password', { method: 'POST', body: { token: 'x', password: '123' } })).status, 400);
  });

  test('a category filter that isn’t one name of up to 60 characters is rejected before touching the database', async () => {
    assert.equal((await call(`/products?category=${'x'.repeat(61)}`)).status, 400);
    assert.equal((await call('/products?category=Gloves&category=Syringes')).status, 400);
  });

  test('Google sign-in: no client ID hides it, and only a token Google signed gets in', async () => {
    const saved = process.env.GOOGLE_CLIENT_ID;
    try {
      delete process.env.GOOGLE_CLIENT_ID;
      assert.deepEqual((await call('/auth/google')).body, { clientId: null });
      assert.equal((await call('/auth/google', { method: 'POST', body: { credential: 'a.b.c' } })).status, 503);
      process.env.GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com';
      assert.deepEqual((await call('/auth/google')).body, { clientId: 'test-client.apps.googleusercontent.com' });
      for (const credential of [undefined, 'not-a-token', 'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.x']) {
        assert.equal((await call('/auth/google', { method: 'POST', body: { credential } })).status, 401, String(credential));
      }
    } finally {
      if (saved === undefined) delete process.env.GOOGLE_CLIENT_ID;
      else process.env.GOOGLE_CLIENT_ID = saved;
    }
  });
});

describe('with database', { skip: !process.env.DATABASE_URL && 'DATABASE_URL not set' }, () => {
  const stamp = `${process.pid}${Math.floor(performance.now())}`;
  const email = `test-${stamp}@example.com`;
  const otherEmail = `test-${stamp}-other@example.com`;
  let cookie;
  let buyer; // a second customer, whose orders the admin tests work on
  let firstOrder;
  let stockBefore; // the tests' orders change stock, so it is put back afterwards

  before(async () => {
    stockBefore = await query('SELECT id, stock FROM products');
  });

  after(async () => {
    await query('DELETE FROM users WHERE email LIKE ?', [`test-${stamp}%`]);
    for (const { id, stock } of stockBefore) await query('UPDATE products SET stock = ? WHERE id = ?', [stock, id]);
  });

  test('the health check reaches the database', async () => {
    assert.deepEqual(await call('/health'), { status: 200, body: { ok: true }, cookie: undefined });
  });

  test('the storefront’s products are seeded and filter by category and search text', async () => {
    const { products } = (await call('/products')).body;
    assert.deepEqual(products.slice(0, 6).map(product => product.id), [1, 2, 3, 4, 5, 6]);
    const { stock, rating, reviewCount, ...first } = products[0];
    assert.ok(rating === null || (rating >= 1 && rating <= 5), `rating ${rating} should be an average of 1–5 stars`);
    assert.ok(Number.isInteger(reviewCount));
    assert.ok(Number.isInteger(stock) && stock >= 0, `stock ${stock} should be a count`);
    assert.deepEqual(first, {
      id: 1,
      name: 'Magnum 3-Ply Surgical Mask, ISI Marked, Class 2',
      category: 'Face Masks',
      family: 'Magnum 3-Ply Surgical Mask, ISI Marked',
      variant: 'Class 2',
      price: 75,
      mrp: null,
      unit: 'Box of 50',
      badge: 'ISI marked',
      image: '/photos/mask-isi-class2.jpg',
      gallery: ['/photos/kit-isi-mask.jpg', '/photos/magnum-mask-carton.jpg', '/photos/mask-magnum-1.jpg'],
      description:
        'The Magnum Face Mask (Class 1, 2, and 3) is a high-quality 3-ply disposable mask designed for effective protection against airborne particles, dust, and contaminants. These masks provide varying levels of filtration and breathability, ensuring safety and comfort for different environments, from general use to medical and industrial settings.',
      features: ['ISI marked, IS 16289:2014', 'Ear loops and nose wire', 'Box of 50, carton of 3000'],
      specs: [['Brand', 'Magnum'], ['Layers', '3-ply with meltblown filter'], ['Bacterial filtration (BFE)', 'Over 95%'], ['Fastening', 'Ear loops'], ['Nose pin', 'Yes'], ['Edges', 'Ultrasonic sealed'], ['Made in', 'India'], ['Minimum order', '1,000 pieces (wholesale)']],
    });
    assert.equal('badge' in products[3], false, 'a product without a badge has no badge key');
    assert.deepEqual([products[2].family, products[2].variant], ['Disposable Syringe without Needle', '2 ml'], 'a size names its family and variant');

    const ids = async path => (await call(path)).body.products.map(product => product.id);
    assert.deepEqual(await ids('/products?category=Gloves'), [2, 25, 26, 54, 68]);
    assert.deepEqual(await ids(`/products?category=${encodeURIComponent('Bandages & Gauze')}`), [5, 6, 39, 40, 41, 42, 43, 44, 45, 67, 69]);
    assert.deepEqual(await ids(`/products?category=${encodeURIComponent('IV Cannula')}`), [17, 18, 19, 20, 21, 36, 37]);
    assert.deepEqual(await ids('/products?q=SCALP'), [22, 23, 24]);
    assert.deepEqual(await ids('/products?q=cotton&category=Gloves'), []);
    assert.deepEqual(await ids('/products?category=Toys'), [], 'a category with no products finds none');
    assert.deepEqual(await ids('/products?q=%25%25'), [], '% is matched as itself, not as a wildcard');

    assert.equal((await call('/products/2')).body.product.name, 'Nitrile Examination Gloves, Blue');
    assert.equal((await call('/products/999')).status, 404);
    assert.equal((await call('/products/abc')).status, 404);
  });

  test('registering signs the customer in, with both preferences on', async () => {
    const result = await call('/auth/register', { method: 'POST', body: { name: '  Test Customer ', email: email.toUpperCase(), password: 'first-password' } });
    assert.equal(result.status, 201);
    assert.deepEqual(result.body.user, { name: 'Test Customer', email, memberSince: new Date().getUTCFullYear(), hasPassword: true, isAdmin: false, preferences: { smsUpdates: true, offers: true } });
    assert.match(result.cookie, /^ye_session=/);
    cookie = result.cookie;
    assert.deepEqual((await call('/me', { cookie })).body, { user: result.body.user });
  });

  test('the same email cannot register twice', async () => {
    assert.equal((await call('/auth/register', { method: 'POST', body: { name: 'Someone Else', email, password: 'other-password' } })).status, 409);
  });

  test('login checks the password, and logout clears the cookie', async () => {
    assert.equal((await call('/auth/login', { method: 'POST', body: { email, password: 'wrong-password' } })).status, 401);
    assert.equal((await call('/auth/login', { method: 'POST', body: { email: `nobody-${stamp}@example.com`, password: 'first-password' } })).status, 401);
    const login = await call('/auth/login', { method: 'POST', body: { email, password: 'first-password' } });
    assert.equal(login.status, 200);
    assert.equal((await call('/me', { cookie: login.cookie })).body.user.email, email);
    assert.equal((await call('/auth/logout', { method: 'POST', body: {} })).cookie, 'ye_session=');
  });

  test('Google sign-in makes an account once, and links the account that already has that email', async () => {
    const googleEmail = `test-${stamp}-google@example.com`;
    const first = await User.signInWithGoogle({ googleId: `test-${stamp}-1`, email: googleEmail, name: 'Google Customer' });
    assert.equal(first.created, true);
    assert.equal(first.user.password_hash, null);
    const again = await User.signInWithGoogle({ googleId: `test-${stamp}-1`, email: googleEmail, name: 'Google Customer' });
    assert.deepEqual([again.created, again.user.id], [false, first.user.id]);
    const login = await call('/auth/login', { method: 'POST', body: { email: googleEmail, password: 'any-password' } });
    assert.equal(login.status, 401);
    assert.match(login.body.error, /signs in with Google/);

    const linked = await User.signInWithGoogle({ googleId: `test-${stamp}-2`, email, name: 'Someone Else' });
    assert.equal(linked.created, false);
    assert.deepEqual([linked.user.email, linked.user.google_id, linked.user.name], [email, `test-${stamp}-2`, 'Test Customer'], 'linking keeps the account as it was');
    await assert.rejects(User.signInWithGoogle({ googleId: `test-${stamp}-3`, email, name: 'Test Customer' }), { status: 409 });
    assert.equal((await call('/auth/login', { method: 'POST', body: { email, password: 'first-password' } })).status, 200, 'its password still works');
  });

  test('an account without a password sets its first one without a current password', async () => {
    const noPassword = `test-${stamp}-nopassword@example.com`;
    const { cookie: session } = await call('/auth/register', { method: 'POST', body: { name: 'No Password', email: noPassword, password: 'temporary-password' } });
    await query('UPDATE users SET password_hash = NULL WHERE email = ?', [noPassword]);
    assert.equal((await call('/me', { cookie: session })).body.user.hasPassword, false);
    const set = await call('/me/password', { method: 'PUT', cookie: session, body: { newPassword: 'chosen-password' } });
    assert.equal(set.status, 200);
    assert.equal(set.body.user.hasPassword, true);
    assert.equal((await call('/auth/login', { method: 'POST', body: { email: noPassword, password: 'chosen-password' } })).status, 200);
  });

  test('the name can be changed', async () => {
    assert.equal((await call('/me', { method: 'PUT', cookie, body: { name: '   ' } })).status, 400);
    assert.equal((await call('/me', { method: 'PUT', cookie, body: { name: ' Renamed Customer ' } })).body.user.name, 'Renamed Customer');
    assert.equal((await call('/me', { cookie })).body.user.name, 'Renamed Customer');
    await call('/me', { method: 'PUT', cookie, body: { name: 'Test Customer' } });
  });

  test('preferences are checked and saved', async () => {
    assert.equal((await call('/me/preferences', { method: 'PUT', cookie, body: { smsUpdates: 'no', offers: true } })).status, 400);
    const saved = await call('/me/preferences', { method: 'PUT', cookie, body: { smsUpdates: false, offers: true } });
    assert.deepEqual(saved.body.user.preferences, { smsUpdates: false, offers: true });
    assert.deepEqual((await call('/me', { cookie })).body.user.preferences, { smsUpdates: false, offers: true });
  });

  test('the wishlist keeps each product once, most recently saved first', async () => {
    const save = (id, method = 'PUT') => call(`/wishlist/${id}`, { method, cookie, body: {} });
    assert.deepEqual((await call('/wishlist', { cookie })).body, { productIds: [] });
    await save(2);
    await save(5);
    assert.deepEqual((await save(2)).body, { productIds: [5, 2] }, 'saving again keeps one copy');
    assert.equal((await save(999)).status, 404);
    assert.deepEqual((await save(5, 'DELETE')).body, { productIds: [2] });
    assert.deepEqual((await call('/wishlist', { cookie })).body, { productIds: [2] });
  });

  test('an order is priced from the database, whatever prices the browser sends', async () => {
    const { image } = (await call('/products/4')).body.product;
    const result = await call('/orders', { method: 'POST', cookie, body: {
      items: [{ id: 4, quantity: 1, price: 1 }], delivery: { ...delivery, city: ' New Delhi ' }, paymentMethod: 'cod', subtotal: 1, total: 1,
    } });
    assert.equal(result.status, 201);
    const { id, placedAt, ...order } = result.body.order;
    assert.match(id, /^YE\d{8}$/);
    assert.ok(Math.abs(Date.parse(placedAt) - Date.now()) < 60_000, `placedAt ${placedAt} should be now`);
    assert.deepEqual(order, {
      email,
      items: [{ id: 4, name: 'IV Infusion Set', price: 899, unit: 'Pack of 10', image, quantity: 1 }],
      subtotal: 899,
      discount: 0,
      couponCode: null,
      deliveryFee: 99,
      total: 998,
      delivery,
      paymentMethod: 'cod',
      status: 'Processing',
      tracking: null,
    });
    firstOrder = result.body.order;
  });

  test('delivery is free from ₹2,500', async () => {
    const result = await call('/orders', { method: 'POST', cookie, body: { items: [{ id: 4, quantity: 2 }, { id: 6, quantity: 4 }], delivery, paymentMethod: 'online' } });
    const { subtotal, deliveryFee, total } = result.body.order;
    assert.deepEqual({ subtotal, deliveryFee, total }, { subtotal: 2514, deliveryFee: 0, total: 2514 }, '2 × ₹899 + 4 × ₹179');
  });

  test('order input is checked like the checkout form', async () => {
    const valid = { items: [{ id: 1, quantity: 2 }], delivery, paymentMethod: 'online' };
    const invalid = [
      { ...valid, items: [] },
      { ...valid, items: [{ id: 1, quantity: 0 }] },
      { ...valid, items: [{ id: 1, quantity: 1000 }] },
      { ...valid, items: [{ id: 1, quantity: 1 }, { id: 1, quantity: 1 }] },
      { ...valid, items: [{ id: 999, quantity: 1 }] },
      { ...valid, delivery: { ...delivery, phone: '12345 67890' } },
      { ...valid, delivery: { ...delivery, address: 'Home' } },
      { ...valid, delivery: { ...delivery, city: ' ' } },
      { ...valid, delivery: { ...delivery, pincode: '011005' } },
      { ...valid, paymentMethod: 'card' },
    ];
    for (const body of invalid) {
      assert.equal((await call('/orders', { method: 'POST', cookie, body })).status, 400, JSON.stringify(body));
    }
  });

  test('my orders: newest first, filtered by status, and never someone else’s', async () => {
    const { orders } = (await call('/orders', { cookie })).body;
    assert.equal(orders.length, 2);
    assert.equal(orders[1].id, firstOrder.id, 'newest first');
    await query('UPDATE orders SET status = ? WHERE id = ?', ['Delivered', firstOrder.id]);
    const ids = async status => (await call(`/orders?status=${status}`, { cookie })).body.orders.map(order => order.id);
    assert.deepEqual(await ids('Delivered'), [firstOrder.id]);
    assert.deepEqual(await ids('Processing'), [orders[0].id]);
    assert.deepEqual(await ids('Shipped'), []);
    assert.equal((await call('/orders?status=Lost', { cookie })).status, 400);
    assert.deepEqual((await call(`/orders/${firstOrder.id}`, { cookie })).body.order, { ...firstOrder, status: 'Delivered' });

    const other = (await call('/auth/register', { method: 'POST', body: { name: 'Other Customer', email: otherEmail, password: 'other-password' } })).cookie;
    assert.equal((await call(`/orders/${firstOrder.id}`, { cookie: other })).status, 404);
    assert.deepEqual((await call('/orders', { cookie: other })).body.orders, []);
    assert.equal((await call(`/orders/${firstOrder.id}/cancel`, { method: 'POST', cookie: other, body: {} })).status, 404);
  });

  test('an order can be cancelled while it is processing, which puts its items back in stock', async () => {
    const stockOf = async id => (await call(`/products/${id}`)).body.product.stock;
    const before = await stockOf(6);
    const placed = (await call('/orders', { method: 'POST', cookie, body: { items: [{ id: 6, quantity: 3 }], delivery, paymentMethod: 'cod' } })).body.order;
    assert.equal(await stockOf(6), before - 3);
    const cancel = id => call(`/orders/${id}/cancel`, { method: 'POST', cookie, body: {} });
    assert.deepEqual(await cancel(placed.id), { status: 200, body: { order: { ...placed, status: 'Cancelled' } }, cookie: undefined });
    assert.equal(await stockOf(6), before);
    assert.equal((await cancel(placed.id)).status, 409, 'already cancelled');
    assert.equal((await cancel(firstOrder.id)).status, 409, 'already delivered');
    assert.deepEqual((await call('/orders?status=Cancelled', { cookie })).body.orders.map(order => order.id), [placed.id]);
  });

  test('nobody can order more than is in stock', async () => {
    await query('UPDATE products SET stock = 1 WHERE id = 3');
    const order = quantity => call('/orders', { method: 'POST', cookie, body: { items: [{ id: 3, quantity }], delivery, paymentMethod: 'cod' } });
    assert.deepEqual(await order(2), { status: 409, body: { error: 'Only 1 left of Disposable Syringe without Needle, 2 ml. Lower the quantity and try again.' }, cookie: undefined });
    assert.equal((await order(1)).status, 201);
    assert.equal((await call('/products/3')).body.product.stock, 0);
    assert.equal((await order(1)).body.error, 'Disposable Syringe without Needle, 2 ml is out of stock. Remove it from your cart to order the rest.');
  });

  test('only admins get the admin API, and the database flag is what makes one', async () => {
    buyer = (await call('/auth/register', { method: 'POST', body: { name: 'Admin Test Buyer', email: `test-${stamp}-buyer@example.com`, password: 'buyer-password' } })).cookie;
    assert.deepEqual((await call('/admin/summary', { cookie: buyer })).body, { error: 'This page is for YourEcom staff only.' });
    assert.equal((await call('/admin/products/4', { method: 'PUT', cookie: buyer, body: {} })).status, 403);

    await query('UPDATE users SET is_admin = TRUE WHERE email = ?', [email]);
    assert.equal((await call('/me', { cookie })).body.user.isAdmin, true);
    const { counts, today, last30Days } = (await call('/admin/summary', { cookie })).body;
    assert.deepEqual(Object.keys(counts), ['Processing', 'Shipped', 'Delivered', 'Cancelled']);
    assert.ok(Object.values(counts).every(Number.isInteger));
    assert.ok(today.orders >= 1 && today.sales >= 998, 'this run’s orders count as today’s');
    assert.ok(last30Days.orders >= today.orders && last30Days.sales >= today.sales);
  });

  test('admins find any customer’s order by number or phone, ship it with tracking, and cancel orders back into stock', async () => {
    const place = async () => (await call('/orders', { method: 'POST', cookie: buyer, body: { items: [{ id: 6, quantity: 2 }], delivery: { ...delivery, phone: '+91 91234-56780' }, paymentMethod: 'cod' } })).body.order;
    const shipped = await place();
    const cancelled = await place();
    const list = async filter => (await call(`/admin/orders${filter}`, { cookie })).body;
    const ids = async filter => (await list(filter)).orders.map(order => order.id);

    assert.deepEqual(await ids(`?q=${shipped.id.toLowerCase()}`), [shipped.id], 'by order number, in any case');
    const byPhone = await list('?q=091234 56780');
    assert.deepEqual(byPhone.orders.map(order => order.id), [cancelled.id, shipped.id], 'by phone however it’s typed, newest first');
    assert.deepEqual([byPhone.total, byPhone.page, byPhone.pageSize], [2, 1, 20]);
    assert.deepEqual(byPhone.orders[1], { ...shipped, customerName: 'Admin Test Buyer' });
    assert.deepEqual(await ids('?q=admin%20test%20BUYER&status=Processing'), [shipped.id, cancelled.id], 'the queue to ship is oldest first');
    assert.deepEqual(await ids('?q=9123456780&page=2'), []);
    for (const filter of ['?status=Lost', '?page=0', '?page=x']) assert.equal((await call(`/admin/orders${filter}`, { cookie })).status, 400, filter);
    assert.equal((await call('/admin/orders/YE00000000', { cookie })).status, 404);

    const setStatus = (id, body) => call(`/admin/orders/${id}/status`, { method: 'PUT', cookie, body });
    const ship = (await setStatus(shipped.id, { status: 'Shipped', tracking: '  DTDC D12345678 ' })).body.order;
    assert.deepEqual([ship.status, ship.tracking], ['Shipped', 'DTDC D12345678']);
    const seen = (await call(`/orders/${shipped.id}`, { cookie: buyer })).body.order;
    assert.deepEqual([seen.status, seen.tracking], ['Shipped', 'DTDC D12345678'], 'the customer sees it shipped, with tracking');
    assert.deepEqual((await call(`/orders/${shipped.id}/cancel`, { method: 'POST', cookie: buyer, body: {} })).body, { error: 'This order has already shipped, so it can’t be cancelled.' });
    assert.equal((await setStatus(shipped.id, { status: 'Shipped', tracking: 'Blue Dart 98765' })).body.order.tracking, 'Blue Dart 98765', 'tracking can be corrected');
    assert.equal((await setStatus(shipped.id, { status: 'Delivered' })).body.order.status, 'Delivered');
    assert.equal((await setStatus(shipped.id, { status: 'Cancelled' })).status, 409, 'delivered is final');
    assert.equal((await setStatus(shipped.id, { status: 'Processing' })).status, 400);
    assert.equal((await setStatus('YE00000000', { status: 'Delivered' })).status, 404);

    const stockOf = async id => (await call(`/products/${id}`)).body.product.stock;
    const stock = await stockOf(6);
    assert.equal((await setStatus(cancelled.id, { status: 'Cancelled' })).body.order.status, 'Cancelled');
    assert.equal(await stockOf(6), stock + 2, 'cancelling puts the items back in stock');
    assert.equal((await setStatus(cancelled.id, { status: 'Shipped' })).status, 409, 'cancelled is final');
  });

  // A product as the admin pages' form sends it: every field, photos main first.
  const formFor = product => ({
    name: product.name, category: product.category, family: product.family ?? '', variant: product.variant ?? '', price: product.price, mrp: product.mrp, stock: product.stock,
    unit: product.unit, badge: product.badge ?? '', description: product.description, photos: [product.image, ...product.gallery], features: product.features, specs: product.specs,
  });

  test('admins edit every part of a product, and the store shows it at once', async () => {
    const [original] = await query('SELECT * FROM products WHERE id = 4');
    const { product: before } = (await call('/products/4')).body;
    const save = (id, body) => call(`/admin/products/${id}`, { method: 'PUT', cookie, body });
    try {
      assert.deepEqual((await save(4, formFor(before))).body.product, before, 'saving the form unchanged changes nothing');
      const changes = {
        ...formFor(before), name: ' IV Infusion Set, Vented ', family: 'IV Infusion Set', variant: 'Vented', price: 850, mrp: 999, stock: 40, unit: ' Pack of 10 sets ', badge: ' ',
        description: ' A new description. ', photos: ['/photos/test-main.jpg', before.image], features: [' Vented spike ', ''], specs: [['Tube', ' 150 cm '], ['', '']],
      };
      const saved = await save(4, changes);
      assert.equal(saved.status, 200);
      const { product } = (await call('/products/4')).body;
      assert.deepEqual(saved.body.product, product);
      const withoutReviews = ({ rating, reviewCount, ...rest }) => rest;
      const { badge, ...unbadged } = withoutReviews(before);
      assert.deepEqual(withoutReviews(product), {
        ...unbadged, name: 'IV Infusion Set, Vented', family: 'IV Infusion Set', variant: 'Vented', price: 850, mrp: 999, stock: 40, unit: 'Pack of 10 sets',
        description: 'A new description.', image: '/photos/test-main.jpg', gallery: [before.image], features: ['Vented spike'], specs: [['Tube', '150 cm']],
      }, `an empty badge (was ${badge}) is none`);
      for (const change of [{ price: 0 }, { mrp: 849 }, { stock: '40' }, { name: '' }, { category: ' ' }, { variant: '' }, { photos: [] }, { photos: ['https://example.com/x.jpg'] }, { features: [] }]) {
        assert.equal((await save(4, { ...changes, ...change })).status, 400, JSON.stringify(change));
      }
      assert.equal((await save(999, changes)).status, 404);
    } finally {
      const columns = ['name', 'category', 'family', 'variant', 'price', 'mrp', 'unit', 'stock', 'badge', 'image', 'gallery', 'description', 'features', 'specs'];
      const json = column => (['gallery', 'features', 'specs'].includes(column) && original[column] !== null ? JSON.stringify(original[column]) : original[column]);
      await query(`UPDATE products SET ${columns.map(column => `${column} = ?`).join(', ')} WHERE id = 4`, columns.map(json));
    }
  });

  test('admins upload photos and add products, numbered after the highest id', async () => {
    const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('test photo')]);
    const upload = (files, { as = cookie, header = true } = {}) => {
      const form = new FormData();
      for (const [name, bytes] of files) form.append('photos', new Blob([bytes]), name);
      const headers = { Cookie: as, ...(header ? { 'X-Requested-With': 'fetch' } : {}) };
      return fetch(`${base}/admin/uploads`, { method: 'POST', headers, body: form }).then(async response => ({ status: response.status, body: await response.json() }));
    };
    const uploaded = await upload([['front.png', png], ['back.PNG', png]]);
    const added = [];
    try {
      assert.equal(uploaded.status, 201);
      assert.equal(uploaded.body.urls.length, 2);
      for (const url of uploaded.body.urls) assert.match(url, /^\/api\/uploads\/[0-9a-f]{24}\.png$/);
      const served = await fetch(`${new URL(base).origin}${uploaded.body.urls[0]}`);
      assert.deepEqual([served.status, served.headers.get('content-type'), served.headers.get('x-content-type-options')], [200, 'image/png', 'nosniff']);
      assert.deepEqual(Buffer.from(await served.arrayBuffer()), png);

      assert.deepEqual((await upload([['notes.png', Buffer.from('<svg/>')]])).body, { error: 'notes.png isn’t a JPEG, PNG or WebP photo.' });
      assert.equal((await upload([['big.png', Buffer.concat([png, Buffer.alloc(5 * 1024 * 1024)])]])).status, 413);
      assert.equal((await upload(Array.from({ length: 9 }, (_, index) => [`p${index}.png`, png]))).status, 400, 'up to 8 at a time');
      assert.equal((await upload([['front.png', png]], { header: false })).status, 415);
      assert.equal((await upload([['front.png', png]], { as: buyer })).status, 403);

      const [{ highest }] = await query('SELECT MAX(id) AS highest FROM products');
      const product = {
        name: 'Test Specimen Bag', category: `Test Category ${stamp}`, family: '', variant: '', price: 120, mrp: null, stock: 25, unit: 'Pack of 100', badge: 'New',
        description: 'Zip-lock specimen bags.', photos: uploaded.body.urls, features: ['Zip lock'], specs: [],
      };
      const created = await call('/admin/products', { method: 'POST', cookie, body: product });
      added.push(created.body.product?.id);
      assert.equal(created.status, 201);
      assert.equal(created.body.product.id, highest + 1);
      assert.deepEqual(formFor(created.body.product), product);
      assert.deepEqual((await call(`/products/${highest + 1}`)).body.product, created.body.product, 'in the store at once');
      assert.deepEqual((await call(`/products?category=${encodeURIComponent(product.category)}`)).body.products.map(item => item.id), [highest + 1], 'in a new category');
      const respelt = await call('/admin/products', { method: 'POST', cookie, body: { ...product, category: ' lab   DISPOSABLES ' } });
      added.push(respelt.body.product?.id);
      assert.equal(respelt.body.product.category, 'Lab Disposables', 'a category the store has keeps its spelling');
      assert.equal((await call('/admin/products', { method: 'POST', cookie, body: { ...product, photos: [] } })).status, 400);
      assert.equal((await call('/admin/products', { method: 'POST', cookie: buyer, body: product })).status, 403);
    } finally {
      for (const id of added.filter(Boolean)) await query('DELETE FROM products WHERE id = ?', [id]);
      for (const url of uploaded.body.urls ?? []) await rm(path.join(UPLOAD_DIR, path.basename(url)), { force: true });
    }
  });

  test('only customers who ordered a product can review it, once each', async () => {
    const review = (id, body) => call(`/products/${id}/reviews`, { method: 'PUT', cookie, body });
    assert.equal((await review(1, { rating: 5 })).status, 403, 'never ordered');
    assert.equal((await review(4, { rating: 6 })).status, 400);
    assert.equal((await review(4, { rating: 4, comment: 'x'.repeat(1001) })).status, 400);
    assert.equal((await review(4, { rating: 2, comment: ' Leaky ' })).status, 200);
    const saved = (await review(4, { rating: 4, comment: 'Works well' })).body;
    const mine = saved.reviews.filter(item => item.mine).map(({ name, rating, comment }) => ({ name, rating, comment }));
    assert.deepEqual(mine, [{ name: 'Test C.', rating: 4, comment: 'Works well' }], 'the second review replaced the first');
    assert.equal(saved.canReview, true);
    const { product } = (await call('/products/4')).body;
    assert.ok(product.reviewCount >= 1 && product.rating >= 1, 'the product carries its rating');
    const signedOut = (await call('/products/4/reviews')).body;
    assert.equal(signedOut.canReview, false);
    assert.equal(signedOut.reviews.some(item => item.mine), false);
    assert.equal((await call('/products/999/reviews')).status, 404);
  });

  test('a coupon works once per customer, from its minimum order, and comes back when the order is cancelled', async () => {
    const shopper = (await call('/auth/register', { method: 'POST', body: { name: 'Coupon Customer', email: `test-${stamp}-coupons@example.com`, password: 'coupon-password' } })).cookie;
    const codes = async () => (await call('/coupons', { cookie: shopper })).body.coupons.map(coupon => coupon.code);
    const order = (couponCode, items = [{ id: 4, quantity: 1 }]) => call('/orders', { method: 'POST', cookie: shopper, body: { items, delivery, paymentMethod: 'cod', couponCode } });
    const totals = ({ subtotal, discount, couponCode, deliveryFee, total }) => ({ subtotal, discount, couponCode, deliveryFee, total });

    assert.deepEqual(await codes(), ['WELCOME10', 'SAVE100', 'BULK15']);
    assert.deepEqual((await call('/coupons/welcome10', { cookie: shopper })).body.coupon, {
      code: 'WELCOME10', kind: 'percent', amount: 10, maxDiscount: 250, minSubtotal: 0, firstOrderOnly: true, expiresAt: null,
    });
    assert.equal((await call('/coupons/NOSUCHCODE', { cookie: shopper })).status, 404);

    const welcome = await order('welcome10');
    assert.equal(welcome.status, 201);
    assert.deepEqual(totals(welcome.body.order), { subtotal: 899, discount: 89, couponCode: 'WELCOME10', deliveryFee: 99, total: 909 });
    assert.deepEqual((await order('WELCOME10')).body, { error: 'You’ve already used WELCOME10. Each code works once per customer.' });
    assert.deepEqual(await codes(), ['SAVE100', 'BULK15']);

    assert.deepEqual((await order('SAVE100')).body, { error: 'SAVE100 is for orders of ₹1,000 or more.' });
    const save = await order('SAVE100', [{ id: 4, quantity: 2 }]);
    assert.deepEqual(totals(save.body.order), { subtotal: 1798, discount: 100, couponCode: 'SAVE100', deliveryFee: 99, total: 1797 });
    assert.deepEqual(await codes(), ['BULK15']);
    await call(`/orders/${save.body.order.id}/cancel`, { method: 'POST', cookie: shopper, body: {} });
    assert.deepEqual(await codes(), ['SAVE100', 'BULK15'], 'cancelling gives the code back');

    const bulk = await order('BULK15', [{ id: 60, quantity: 11 }]);
    assert.deepEqual(totals(bulk.body.order), { subtotal: 11000, discount: 1500, couponCode: 'BULK15', deliveryFee: 0, total: 9500 }, '15% capped at ₹1,500; free delivery goes by the subtotal');
  });

  test('a switched-off or expired coupon can’t be used', async () => {
    const [expired, retired] = [`TEST${stamp}A`, `TEST${stamp}B`];
    await query("INSERT INTO coupons (code, kind, amount, expires_at, active) VALUES (?, 'flat', 50, NOW() - INTERVAL 1 DAY, TRUE), (?, 'flat', 50, NULL, FALSE)", [expired, retired]);
    try {
      assert.deepEqual((await call(`/coupons/${expired}`, { cookie })).body, { error: `${expired} has expired.` });
      assert.equal((await call(`/coupons/${retired}`, { cookie })).status, 404);
      assert.ok(!(await call('/coupons', { cookie })).body.coupons.some(coupon => [expired, retired].includes(coupon.code)));
      assert.equal((await call('/orders', { method: 'POST', cookie, body: { items: [{ id: 1, quantity: 1 }], delivery, paymentMethod: 'cod', couponCode: expired } })).status, 400);
    } finally {
      await query('DELETE FROM coupons WHERE code IN (?, ?)', [expired, retired]);
    }
  });

  test('a forgotten password is reset once from the emailed link, which signs out everywhere else', async () => {
    const resetEmail = `test-${stamp}-reset@example.com`;
    const old = (await call('/auth/register', { method: 'POST', body: { name: 'Reset Customer', email: resetEmail, password: 'forgotten-password' } })).cookie;
    const forgot = email => call('/auth/forgot-password', { method: 'POST', body: { email } });
    assert.deepEqual((await forgot(`nobody-${stamp}@example.com`)).body, { ok: true }, 'the same answer without an account');
    assert.deepEqual((await forgot(resetEmail.toUpperCase())).body, { ok: true });
    const [{ user_id: userId }] = await query('SELECT user_id FROM password_resets JOIN users ON users.id = password_resets.user_id WHERE users.email = ?', [resetEmail]);

    // Only the email has the real token, so the test adds links of its own for this customer.
    const link = async (token, minutes) => query('INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (SHA2(?, 256), ?, NOW() + INTERVAL ? MINUTE)', [token, userId, minutes]);
    const reset = (token, password) => call('/auth/reset-password', { method: 'POST', body: { token, password } });
    await link(`expired-${stamp}`, -1);
    assert.equal((await reset(`expired-${stamp}`, 'remembered-password')).status, 400, 'expired');
    await link(`valid-${stamp}`, 5);
    assert.equal((await reset(`valid-${stamp}`, '12345')).status, 400, 'too short');
    const done = await reset(`valid-${stamp}`, 'remembered-password');
    assert.equal(done.status, 200, 'a too-short password didn’t use the link up');
    assert.match(done.cookie, /^ye_session=/);
    assert.equal((await call('/me', { cookie: old })).body.user, null, 'older sessions are over');
    assert.equal((await reset(`valid-${stamp}`, 'another-password')).status, 400, 'each link works once');
    assert.deepEqual(await query('SELECT * FROM password_resets WHERE user_id = ?', [userId]), [], 'the emailed link stops working too');
    assert.equal((await call('/auth/login', { method: 'POST', body: { email: resetEmail, password: 'remembered-password' } })).status, 200);
  });

  test('sign-in attempts are limited per email address', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      assert.equal((await call('/auth/login', { method: 'POST', body: { email: otherEmail, password: 'wrong-password' } })).status, 401);
    }
    assert.equal((await call('/auth/login', { method: 'POST', body: { email: otherEmail, password: 'other-password' } })).status, 429);
    assert.equal((await call('/auth/login', { method: 'POST', body: { email, password: 'first-password' } })).status, 200, 'other accounts are unaffected');
  });

  test('changing the password checks the old one and signs out every other browser', async () => {
    const elsewhere = (await call('/auth/login', { method: 'POST', body: { email, password: 'first-password' } })).cookie;
    const change = body => call('/me/password', { method: 'PUT', cookie, body });
    assert.deepEqual((await change({ currentPassword: 'wrong-password', newPassword: 'second-password' })).body, { error: 'Your current password is incorrect.' });
    assert.equal((await change({ currentPassword: 'first-password', newPassword: '12345' })).status, 400);
    assert.equal((await change({ currentPassword: 'first-password', newPassword: 'first-password' })).status, 400);

    const changed = await change({ currentPassword: 'first-password', newPassword: 'second-password' });
    assert.equal(changed.status, 200);
    assert.match(changed.cookie, /^ye_session=/, 'this browser gets a fresh session');
    assert.equal((await call('/me', { cookie: changed.cookie })).body.user.email, email);
    assert.equal((await call('/me', { cookie })).body.user, null, 'the old session is over');
    assert.equal((await call('/me', { cookie: elsewhere })).body.user, null, 'so are other browsers');
    assert.equal((await call('/auth/login', { method: 'POST', body: { email, password: 'second-password' } })).status, 200);
  });
});
