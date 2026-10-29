// An order shaped like the storefront's Order (frontend/src/types/store.ts). Its items are
// the snapshots taken when it was placed, not the products as they are now.
const itemView = ({ id, name, price, unit, image, quantity }) => ({ id, name, price, unit, image, quantity });
const deliveryView = ({ name, phone, address, city, pincode }) => ({ name, phone, address, city, pincode });

// `user` is the customer who placed it (every order route is for the customer's own orders).
export function orderView(row, user) {
  return {
    id: row.id,
    email: user.email,
    placedAt: new Date(row.placed_at).toISOString(),
    items: row.items.map(itemView),
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    delivery: deliveryView(row.delivery),
    paymentMethod: row.payment_method,
    status: row.status,
  };
}
