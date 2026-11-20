// An order shaped like the storefront's Order (frontend/src/types/store.ts). Its items are
// the snapshots taken when it was placed, not the products as they are now. An item's price is a
// retail price with GST, or on a bulk item (bulk: true) the bulk price before the GST in `gst`. Orders
// placed before bulk orders existed have only retail items.
const itemView = ({ id, name, price, unit, image, quantity, bulk = false, gstRate = null, gst = 0 }) => ({ id, name, price, unit, image, quantity, bulk, gstRate, gst });
const deliveryView = ({ name, phone, address, city, pincode }) => ({ name, phone, address, city, pincode });

// How the order is paid: 'cod' (cash on delivery), or online: 'pending' until Razorpay has the money, then 'paid'.
const paymentStatus = row => (row.payment_method === 'cod' ? 'cod' : row.paid_at ? 'paid' : 'pending');

// `user` is the customer who placed it (every order route is for the customer's own orders).
// `tracking` (courier and tracking number) is null until the order ships.
export function orderView(row, user) {
  return {
    id: row.id,
    email: user.email,
    placedAt: new Date(row.placed_at).toISOString(),
    items: row.items.map(itemView),
    subtotal: row.subtotal,
    discount: row.discount,
    couponCode: row.coupon_code,
    gst: row.gst,
    deliveryFee: row.delivery_fee,
    total: row.total,
    delivery: deliveryView(row.delivery),
    paymentMethod: row.payment_method,
    paymentStatus: paymentStatus(row),
    status: row.status,
    tracking: row.tracking,
  };
}

// For the admin pages (frontend AdminOrder): the same, with the name on the account that placed it and the
// Razorpay payment ID of an order paid online (to find it in the Razorpay Dashboard, for a refund say). The row
// comes from models/order.model.js's admin queries, which add customer_name and customer_email.
export function adminOrderView(row) {
  return { ...orderView(row, { email: row.customer_email }), customerName: row.customer_name, paymentId: row.razorpay_payment_id ?? null };
}
