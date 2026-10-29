import { startTransition, useRef, useState, type ReactElement } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import { CartDrawer } from '@/components/CartDrawer';
import { Footer, Header } from '@/components/StoreShared';
import { products } from '@/data/products';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { addToLines, setLineQuantity } from '@/lib/cart';
import { deliveryFeeFor } from '@/lib/pricing';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { ProductPage } from '@/pages/ProductPage';
import { ProfilePage } from '@/pages/ProfilePage';
import type { CartItem, CartLine, DeliveryDetails, Order, PaymentMethod, Product, User } from '@/types/store';

type Notice = { message: string; action?: { label: string; run: () => void } };

function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [cartLines, setCartLines] = usePersistentState<CartLine[]>('yourecom.cart', []);
  const [user, setUser] = usePersistentState<User | null>('yourecom.user', null);
  const [orders, setOrders] = usePersistentState<Order[]>('yourecom.orders', []);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeTimer = useRef<number>();
  useScrollRestoration();

  // The cart stores ids only, so prices and images always come from the current catalogue.
  const cart = cartLines.flatMap((line: CartLine): CartItem[] => {
    const product = products.find((item: Product) => item.id === line.id);
    return product ? [{ ...product, quantity: line.quantity }] : [];
  });
  const cartCount = cart.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);
  const userOrders = user ? orders.filter((order: Order) => order.email === user.email) : [];

  const notify = (message: string, action?: Notice['action']): void => {
    window.clearTimeout(noticeTimer.current);
    setNotice({ message, action });
    noticeTimer.current = window.setTimeout(() => setNotice(null), action ? 4000 : 2500);
  };

  const openCart = (): void => {
    setNotice(null);
    setCartOpen(true);
  };

  const quantityOf = (id: number): number => cartLines.find((line: CartLine) => line.id === id)?.quantity ?? 0;

  const addToCart = (product: Product): void => {
    setCartLines((current: CartLine[]) => addToLines(current, product.id, 1));
    notify(`${product.name} added to cart`, { label: 'View cart', run: openCart });
  };

  const setQuantity = (id: number, quantity: number): void => setCartLines((current: CartLine[]) => setLineQuantity(current, id, quantity));

  const cartActions = { quantityOf, addToCart, setQuantity };

  const buyAgain = (order: Order): void => {
    setCartLines((current: CartLine[]) => order.items.reduce((lines: CartLine[], item: CartItem) => addToLines(lines, item.id, item.quantity), current));
    openCart();
  };

  const placeOrder = (email: string, delivery: DeliveryDetails, paymentMethod: PaymentMethod): Order => {
    const deliveryFee = deliveryFeeFor(cartTotal);
    const order: Order = {
      id: `YE${Date.now().toString().slice(-8)}`,
      email,
      placedAt: new Date().toISOString(),
      items: cart,
      subtotal: cartTotal,
      deliveryFee,
      total: cartTotal + deliveryFee,
      delivery,
      paymentMethod,
      status: 'Processing',
    };
    setOrders((current: Order[]) => [order, ...current]);
    setCartLines([]);
    return order;
  };

  const signIn = (name: string, email: string): void => {
    setUser({ name, email, memberSince: new Date().getFullYear(), preferences: { smsUpdates: true, offers: true } });
    notify(`Welcome, ${name.split(' ')[0]}`);
  };

  const signOut = (): void => {
    navigate('/');
    // React Router applies navigations as transitions. Clearing the user in the same transition
    // stops the account guard from seeing a signed-out user on /profile and redirecting to /login.
    startTransition(() => setUser(null));
    notify('You have been signed out');
  };

  const updatePreferences = (preferences: User['preferences']): void => setUser((current: User | null) => current && { ...current, preferences });

  const requireUser = (render: (currentUser: User) => ReactElement): ReactElement =>
    user ? render(user) : <Navigate to="/login" replace state={{ from: pathname }} />;

  return (
    <div className="min-h-screen bg-[#f8fbfd] text-[#102f55]">
      <Header cartCount={cartCount} openCart={openCart} search={search} setSearch={setSearch} user={user} />
      <Routes>
        <Route path="/" element={<HomePage {...cartActions} search={search} setSearch={setSearch} />} />
        <Route path="/product/:id" element={<ProductPage {...cartActions} openCart={openCart} />} />
        <Route
          path="/checkout"
          element={requireUser((currentUser: User) => (
            <CheckoutPage
              cart={cart}
              cartTotal={cartTotal}
              user={currentUser}
              savedDelivery={userOrders[0]?.delivery}
              setQuantity={setQuantity}
              placeOrder={(delivery: DeliveryDetails, paymentMethod: PaymentMethod) => placeOrder(currentUser.email, delivery, paymentMethod)}
            />
          ))}
        />
        <Route path="/login" element={<LoginPage user={user} signIn={signIn} />} />
        <Route
          path="/profile"
          element={requireUser((currentUser: User) => (
            <ProfilePage user={currentUser} orders={userOrders} signOut={signOut} updatePreferences={updatePreferences} />
          ))}
        />
        <Route path="/orders" element={requireUser(() => <OrdersPage orders={userOrders} buyAgain={buyAgain} />)} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
      <div aria-live="polite">
        {notice && (
          <div className="fixed bottom-5 left-1/2 z-50 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-full bg-[#082b62] py-2 pl-4 pr-2 text-sm font-bold text-white shadow-2xl">
            <Check size={17} className="shrink-0 text-[#c9f23b]" />
            <span className="min-w-0 truncate">{notice.message}</span>
            {notice.action ? (
              <button onClick={notice.action.run} className="shrink-0 rounded-full bg-[#c9f23b] px-3 py-1.5 text-xs font-black text-[#082b62] transition hover:bg-white">
                {notice.action.label}
              </button>
            ) : (
              <span className="pr-2" />
            )}
          </div>
        )}
      </div>
      <CartDrawer
        open={cartOpen}
        cart={cart}
        cartCount={cartCount}
        cartTotal={cartTotal}
        setOpen={setCartOpen}
        setQuantity={setQuantity}
        checkout={() => {
          setCartOpen(false);
          navigate('/checkout');
        }}
      />
    </div>
  );
}

export default App;
