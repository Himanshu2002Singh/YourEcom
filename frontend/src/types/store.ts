import type { categories } from '@/data/categories';

export type Category = (typeof categories)[number];

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
export type OrderStatus = 'Processing' | 'Delivered' | 'Cancelled';

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
};
