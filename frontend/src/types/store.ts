// A category's name: one of the store's own (data/categories.ts) or one an admin added with a product.
export type Category = string;

export type Product = {
  id: number;
  name: string;
  category: Category;
  family?: string; // the name shared by every size of the product, e.g. 'Disposable Syringe without Needle'
  variant?: string; // this size within its family, e.g. '2 ml'
  price: number;
  mrp: number | null; // the printed MRP, shown struck through beside the price
  unit: string;
  stock: number; // how many can still be ordered
  badge?: string;
  image: string;
  gallery: string[]; // more photos after `image`
  description: string;
  features: string[];
  specs: [string, string][]; // the details table: [['Needle', 'Included, 24G'], ...]
  rating: number | null; // average stars, null before the first review
  reviewCount: number;
};

export type Review = { name: string; rating: number; comment: string; createdAt: string; mine: boolean };

export type CartLine = { id: number; quantity: number };
export type CartItem = Product & { quantity: number };
// What an order keeps of each product: a copy taken when the order was placed.
export type OrderItem = Pick<Product, 'id' | 'name' | 'price' | 'unit' | 'image'> & { quantity: number };

export type User = {
  name: string;
  email: string;
  memberSince: number;
  hasPassword: boolean; // false for an account made with Google until a password is set
  isAdmin: boolean; // may use the admin pages (/admin); the API checks it again on every admin request
  preferences: { smsUpdates: boolean; offers: boolean };
};

// A discount code the signed-in customer can use (each works once per customer).
export type Coupon = {
  code: string;
  kind: 'percent' | 'flat';
  amount: number; // the percentage off, or the rupees off
  maxDiscount: number | null; // the most a percent coupon takes off
  minSubtotal: number;
  firstOrderOnly: boolean;
  expiresAt: string | null;
};

export type DeliveryDetails = { name: string; phone: string; address: string; city: string; pincode: string };
export type PaymentMethod = 'online' | 'cod';
export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export type Order = {
  id: string;
  email: string;
  placedAt: string;
  items: OrderItem[];
  subtotal: number;
  discount: number; // what couponCode took off the subtotal
  couponCode: string | null;
  deliveryFee: number;
  total: number; // subtotal - discount + deliveryFee
  delivery: DeliveryDetails;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  tracking: string | null; // courier and tracking number, once it ships
};

// The admin pages' view of an order: the same, with the name on the account that placed it.
export type AdminOrder = Order & { customerName: string };

// GET /api/admin/orders: one page of orders, how many match, and how many are in each status.
export type AdminOrderList = { orders: AdminOrder[]; total: number; page: number; pageSize: number; counts: Record<OrderStatus, number> };

// GET /api/admin/summary. Sales are order totals, leaving out cancelled orders.
export type SalesTotal = { orders: number; sales: number };
export type AdminSummary = { counts: Record<OrderStatus, number>; today: SalesTotal; last30Days: SalesTotal };
