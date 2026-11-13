// An order shaped like the storefront's Order (frontend/src/types/store.ts). Its items are
// the snapshots taken when it was placed, not the products as they are now.
const itemView = ({ id, name, price, unit, image, quantity }) => ({ id, name, price, unit, image, quantity });
const deliveryView = ({ name, phone, address, city, pincode }) => ({ name, phone, address, city, pincode });

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
    deliveryFee: row.delivery_fee,
    total: row.total,
    delivery: deliveryView(row.delivery),
    paymentMethod: row.payment_method,
    status: row.status,
    tracking: row.tracking,
  };
}

// For the admin pages (frontend AdminOrder): the same, with the name on the account that placed it. The row
// comes from models/order.model.js's admin queries, which add customer_name and customer_email.
export function adminOrderView(row) {
  return { ...orderView(row, { email: row.customer_email }), customerName: row.customer_name };
}
