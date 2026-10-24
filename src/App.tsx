import { useState } from 'react';
import { Check } from 'lucide-react';
import { CartDrawer } from '@/components/CartDrawer';
import { Footer, Header } from '@/components/StoreShared';
import { products } from '@/data/products';
import { CheckoutPage, HomePage, LoginPage, OrdersPage, ProductPage, ProfilePage } from '@/pages/StorePages';
import type { CartItem, Product, Screen } from '@/types/store';

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
  const cartCount = cart.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);

  const goTo = (next: Screen): void => {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProduct = (product: Product): void => {
    setSelectedProduct(product);
    goTo('product');
  };

  const addToCart = (product: Product, quantity = 1): void => {
    setCart((current: CartItem[]) => {
      const existing = current.find((item: CartItem) => item.id === product.id);
      return existing
        ? current.map((item: CartItem) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
        : [...current, { ...product, quantity }];
    });
    setNotice(`${product.name} added to cart`);
    setTimeout(() => setNotice(''), 2200);
  };

  const updateQuantity = (id: number, change: number): void => {
    setCart((current: CartItem[]) => current.map((item: CartItem) => item.id === id ? { ...item, quantity: item.quantity + change } : item).filter((item: CartItem) => item.quantity > 0));
  };

  const placeOrder = (): void => setCart([]);

  return <div className="min-h-screen bg-[#f8fbfd] text-[#102f55]">
    <Header screen={screen} setScreen={goTo} cartCount={cartCount} setCartOpen={setCartOpen} search={search} setSearch={setSearch} />
    {screen === 'home' && <HomePage openProduct={openProduct} addToCart={addToCart} search={search} />}
    {screen === 'product' && <ProductPage product={selectedProduct} addToCart={addToCart} setScreen={goTo} />}
    {screen === 'checkout' && <CheckoutPage cart={cart} setScreen={goTo} updateQuantity={updateQuantity} cartTotal={cartTotal} placeOrder={placeOrder} />}
    {screen === 'login' && <LoginPage setScreen={goTo} setLoggedIn={setLoggedIn} />}
    {screen === 'profile' && <ProfilePage setScreen={goTo} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />}
    {screen === 'orders' && <OrdersPage setScreen={goTo} />}
    <Footer />
    {notice && <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#082b62] px-5 py-3 text-sm font-bold text-white shadow-2xl"><Check size={17} className="text-[#c9f23b]" /> {notice}</div>}
    <CartDrawer open={cartOpen} cart={cart} cartCount={cartCount} cartTotal={cartTotal} setOpen={setCartOpen} updateQuantity={updateQuantity} checkout={() => { setCartOpen(false); goTo('checkout'); }} />
  </div>;
}

export default App;
