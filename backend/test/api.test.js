// HTTP tests against the real Express app. The "with database" suite runs only when
// DATABASE_URL is set (backend/.env) and uses throwaway accounts it deletes afterwards.
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import app from '../app.js';
import { closeDb, query } from '../db/pool.js';

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
    assert.equal((await call('/wishlist')).status, 401);
    assert.equal((await call('/wishlist/1', { method: 'PUT', body: {} })).status, 401);
    assert.equal((await call('/products/1/reviews', { method: 'PUT', body: { rating: 5 } })).status, 401);
  });

  test('bad registration input is rejected before touching the database', async () => {
    const valid = { name: 'Test Customer', email: 'a@b.co', password: 'longenough' };
    for (const body of [{ ...valid, name: '  ' }, { ...valid, email: 'nope' }, { ...valid, password: '12345' }]) {
      assert.equal((await call('/auth/register', { method: 'POST', body })).status, 400, JSON.stringify(body));
    }
  });

  test('an unknown product category is rejected before touching the database', async () => {
    assert.equal((await call('/products?category=Toys')).status, 400);
  });
});

describe('with database', { skip: !process.env.DATABASE_URL && 'DATABASE_URL not set' }, () => {
  const stamp = `${process.pid}${Math.floor(performance.now())}`;
  const email = `test-${stamp}@example.com`;
  const otherEmail = `test-${stamp}-other@example.com`;
  let cookie;
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

  test('the storefront’s six products are seeded and filter by category and search text', async () => {
    const { products } = (await call('/products')).body;
    assert.deepEqual(products.slice(0, 6).map(product => product.id), [1, 2, 3, 4, 5, 6]);
    const { stock, rating, reviewCount, ...first } = products[0];
    assert.ok(rating === null || (rating >= 1 && rating <= 5), `rating ${rating} should be an average of 1–5 stars`);
    assert.ok(Number.isInteger(reviewCount));
    assert.ok(Number.isInteger(stock) && stock >= 0, `stock ${stock} should be a count`);
    assert.deepEqual(first, {
      id: 1,
      name: '3-Ply Protective Face Masks',
      category: 'Face Masks',
      price: 249,
      unit: 'Box of 50',
      badge: 'Best seller',
      image: 'https://images.pexels.com/photos/9502813/pexels-photo-9502813.jpeg?auto=compress&cs=tinysrgb&w=1000',
      description: 'Comfortable, breathable and dependable protection for everyday use in clinics, hospitals and at home.',
      features: ['3-layer filtration', 'Soft elastic ear loops', 'Non-woven breathable fabric'],
    });
    assert.equal('badge' in products[2], false, 'a product without a badge has no badge key');

    const ids = async path => (await call(path)).body.products.map(product => product.id);
    assert.deepEqual(await ids('/products?category=Gloves'), [2]);
    assert.deepEqual(await ids(`/products?category=${encodeURIComponent('Gauze & Cotton')}`), [5]);
    assert.deepEqual(await ids('/products?q=STERILE'), [3]);
    assert.deepEqual(await ids('/products?q=cotton&category=Bandages'), []);
    assert.deepEqual(await ids('/products?q=%25'), [], '% is matched as itself, not as a wildcard');

    assert.equal((await call('/products/2')).body.product.name, 'Nitrile Examination Gloves');
    assert.equal((await call('/products/999')).status, 404);
    assert.equal((await call('/products/abc')).status, 404);
  });

  test('registering signs the customer in, with both preferences on', async () => {
    const result = await call('/auth/register', { method: 'POST', body: { name: '  Test Customer ', email: email.toUpperCase(), password: 'first-password' } });
    assert.equal(result.status, 201);
    assert.deepEqual(result.body.user, { name: 'Test Customer', email, memberSince: new Date().getUTCFullYear(), preferences: { smsUpdates: true, offers: true } });
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
      items: [{ id: 4, name: 'IV Administration Set', price: 899, unit: 'Pack of 25', image, quantity: 1 }],
      subtotal: 899,
      deliveryFee: 99,
      total: 998,
      delivery,
      paymentMethod: 'cod',
      status: 'Processing',
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
    assert.equal((await call('/orders?status=Shipped', { cookie })).status, 400);
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
    assert.deepEqual(await order(2), { status: 409, body: { error: 'Only 1 left of Sterile Disposable Syringes. Lower the quantity and try again.' }, cookie: undefined });
    assert.equal((await order(1)).status, 201);
    assert.equal((await call('/products/3')).body.product.stock, 0);
    assert.equal((await order(1)).body.error, 'Sterile Disposable Syringes is out of stock. Remove it from your cart to order the rest.');
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
