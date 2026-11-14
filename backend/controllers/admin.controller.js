// /api/admin — the store's own pages: the orders to ship, sales, and the catalogue.
// Every route is for admins only (routes/admin.routes.js).
import * as Order from '../models/order.model.js';
import * as Product from '../models/product.model.js';
import { HttpError } from '../utils/HttpError.js';
import { cleanOrderQuery, cleanProduct, cleanStatusChange } from '../validators/admin.validator.js';
import { adminOrderView } from '../views/order.view.js';
import { productView } from '../views/product.view.js';

const DAY = 864e5;
const IST = 330 * 60_000; // the store's day runs midnight to midnight in India (UTC+5:30)

// Midnight at the start of today in India.
function startOfToday(now = Date.now()) {
  return new Date(Math.floor((now + IST) / DAY) * DAY - IST);
}

// GET /api/admin/summary — orders in each status, and sales today and over the last 30 days (today included),
// leaving out cancelled orders.
export async function getSummary(request, response) {
  const today = startOfToday();
  const [counts, todaySales, monthSales] = await Promise.all([
    Order.countByStatus(),
    Order.salesSince(today),
    Order.salesSince(new Date(today.getTime() - 29 * DAY)),
  ]);
  response.json({ counts, today: todaySales, last30Days: monthSales });
}

// GET /api/admin/orders?status=&q=&page= — one page of orders, how many match, and the count in each status.
export async function listOrders(request, response) {
  const filter = cleanOrderQuery(request.query);
  const [{ rows, total }, counts] = await Promise.all([Order.listAll(filter), Order.countByStatus()]);
  response.json({ orders: rows.map(adminOrderView), total, page: filter.page, pageSize: filter.pageSize, counts });
}

export async function getOrder(request, response) {
  const order = await Order.findById(request.params.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  response.json({ order: adminOrderView(order) });
}

// PUT /api/admin/orders/:id/status { status: 'Shipped' | 'Delivered' | 'Cancelled', tracking? }
export async function setOrderStatus(request, response) {
  const order = await Order.setStatus(request.params.id, cleanStatusChange(request.body));
  response.json({ order: adminOrderView(order) });
}

// PUT /api/admin/products/:id — the whole product, as the product form sends it. The store shows it at once.
export async function updateProduct(request, response) {
  const product = cleanProduct(request.body);
  const { id } = await Product.findFromParam(request.params.id);
  response.json({ product: productView(await Product.update(id, product)) });
}
