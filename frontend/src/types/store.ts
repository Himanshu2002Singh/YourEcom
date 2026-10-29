import type { categories } from '@/data/categories';

export type Category = (typeof categories)[number];

export type Product = {
  id: number;
  name: string;
  category: Category;
  price: number;
  unit: string;
  stock: number; // how many can still be ordered
  badge?: string;
  image: string;
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

export type DeliveryDetails = { name: string; phone: string; address: string; city: string; pincode: string };
export type PaymentMethod = 'online' | 'cod';
export type OrderStatus = 'Processing' | 'Delivered' | 'Cancelled';

export type Order = {
  id: string;
  email: string;
  placedAt: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  delivery: DeliveryDetails;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
};
