export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  badge?: string;
  image: string;
  description: string;
  features: string[];
};

export type CartItem = Product & { quantity: number };
export type Screen = 'home' | 'product' | 'checkout' | 'login' | 'profile' | 'orders';
