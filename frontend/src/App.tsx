import { startTransition, useCallback, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { Check, CircleAlert } from 'lucide-react';
import { CartDrawer } from '@/components/CartDrawer';
import { Footer, Header, LoadError, Loading, WhatsAppButton } from '@/components/StoreShared';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { ApiError, NO_API, api } from '@/lib/api';
import { addToLines, setLineQuantity } from '@/lib/cart';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { OrderDetailsPage } from '@/pages/OrderDetailsPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { ForgotPasswordPage, ResetPasswordPage } from '@/pages/PasswordResetPages';
import { PolicyPage } from '@/pages/PolicyPage';
import { ProductPage } from '@/pages/ProductPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { WishlistPage } from '@/pages/WishlistPage';
import type { CartItem, CartLine, DeliveryDetails, Order, OrderItem, PaymentMethod, Product, User } from '@/types/store';

type Notice = { message: string; error?: boolean; action?: { label: string; run: () => void } };
type SignInDetails = { mode: 'login' | 'signup'; name: string; email: string; password: string };

// A page that is waiting for the API, or couldn't get what it needed from it.
const PageStatus = ({ children }: { children: ReactNode }) => <main className="mx-auto min-h-[60vh] max-w-7xl px-5 py-10 lg:px-8">{children}</main>;

// Only the cart lives in this browser. The catalogue, the account (a session cookie),
// preferences and orders all come from the backend's database through /api.
function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [cartLines, setCartLines] = usePersistentState<CartLine[]>('yourecom.cart', []);
  const [products, setProducts] = useState<Product[] | null>(null); // null until the catalogue loads
  const [catalogueError, setCatalogueError] = useState('');
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined until the session is checked
  const [orders, setOrders] = useState<Order[] | null>(null); // null until the customer's orders load
  const [wishlist, setWishlist] = useState<number[] | null>(null); // saved product ids; null until they load
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeTimer = useRef<number>();
  useScrollRestoration();

  const notify = useCallback((message: string, { error, action }: Omit<Notice, 'message'> = {}): void => {
    window.clearTimeout(noticeTimer.current);
    setNotice({ message, error, action });
    noticeTimer.current = window.setTimeout(() => setNotice(null), action || error ? 4000 : 2500);
  }, []);

  const loadProducts = useCallback((): void => {
    setCatalogueError('');
    if (NO_API) {
      import('@/data/previewCatalogue').then(({ previewCatalogue }) => setProducts(previewCatalogue));
      return;
    }
    api<{ products: Product[] }>('/products')
      .then(({ products: catalogue }) => setProducts(catalogue))
      .catch((error: ApiError) => setCatalogueError(error.message));
  }, []);

  useEffect(loadProducts, [loadProducts]);

  // Whether this browser is already signed in: the session cookie decides.
  useEffect(() => {
    api<{ user: User | null }>('/me')
      .then(({ user: current }) => setUser(current))
      .catch(() => setUser(null));
  }, []);

  // The signed-in customer's orders (newest first) and wishlist. Reloaded whenever a different customer signs in.
  const signedInEmail = user?.email;
  useEffect(() => {
    setOrders(null);
    setWishlist(null);
    if (!signedInEmail) return;
    let current = true;
    const load = <T,>(path: string, loaded: (data: T) => void, failed: () => void): void => {
      api<T>(path)
        .then((data: T) => {
          if (current) loaded(data);
        })
        .catch((error: ApiError) => {
          if (!current) return;
          failed();
          notify(error.message, { error: true });
        });
    };
    load<{ orders: Order[] }>('/orders', ({ orders: placed }) => setOrders(placed), () => setOrders([]));
    load<{ productIds: number[] }>('/wishlist', ({ productIds }) => setWishlist(productIds), () => setWishlist([]));
    return () => {
      current = false;
    };
  }, [signedInEmail, notify]);

  // The cart stores ids only, so prices and images always come from the current catalogue.
  const cart = cartLines.flatMap((line: CartLine): CartItem[] => {
    const product = products?.find((item: Product) => item.id === line.id);
    return product ? [{ ...product, quantity: line.quantity }] : [];
  });
  const cartCount = cart.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);

  const openCart = (): void => {
    setNotice(null);
    setCartOpen(true);
  };

  const quantityOf = (id: number): number => cartLines.find((line: CartLine) => line.id === id)?.quantity ?? 0;

  const stockNotice = (product: Product): string => (product.stock === 0 ? `${product.name} is out of stock` : `Only ${product.stock} left of ${product.name}`);

  const addToCart = (product: Product): void => {
    if (quantityOf(product.id) >= product.stock) return notify(stockNotice(product), { error: true });
    setCartLines((current: CartLine[]) => addToLines(current, product.id, 1));
    notify(`${product.name} added to cart`, { action: { label: 'View cart', run: openCart } });
  };

  // A quantity never goes above what's in stock; asking for more says how many are left.
  const setQuantity = (id: number, quantity: number): void => {
    const product = products?.find((item: Product) => item.id === id);
    if (product && quantity > product.stock && quantity > quantityOf(id)) notify(stockNotice(product), { error: true });
    setCartLines((current: CartLine[]) => setLineQuantity(current, id, product ? Math.min(quantity, product.stock) : quantity));
  };

  const isSaved = (id: number): boolean => wishlist?.includes(id) ?? false;

  // The heart changes at once; if the server can't save the change, it changes back.
  const toggleSaved = (product: Product): void => {
    if (!user) {
      notify('Sign in to save products to your wishlist', { action: { label: 'Sign in', run: () => navigate('/login', { state: { from: pathname } }) } });
      return;
    }
    const saved = isSaved(product.id);
    const previous = wishlist;
    setWishlist((current: number[] | null) => (saved ? (current ?? []).filter((id: number) => id !== product.id) : [product.id, ...(current ?? [])]));
    notify(saved ? `${product.name} removed from your wishlist` : `${product.name} saved to your wishlist`);
    api(`/wishlist/${product.id}`, { method: saved ? 'DELETE' : 'PUT', body: {} }).catch((error: ApiError) => {
      setWishlist(previous);
      endIfSignedOut(error);
      notify(error.message, { error: true });
    });
  };

  const shopActions = { quantityOf, addToCart, setQuantity, isSaved, toggleSaved };

  const buyAgain = (order: Order): void => {
    setCartLines((current: CartLine[]) => order.items.reduce((lines: CartLine[], item: OrderItem) => addToLines(lines, item.id, item.quantity), current));
    openCart();
  };

  // Sends the cart as ids and quantities only: the backend prices the order from its own catalogue.
  const placeOrder = async (delivery: DeliveryDetails, paymentMethod: PaymentMethod, couponCode?: string): Promise<Order> => {
    try {
      const { order } = await api<{ order: Order }>('/orders', {
        method: 'POST',
        body: { items: cart.map(({ id, quantity }: CartItem) => ({ id, quantity })), delivery, paymentMethod, couponCode },
      });
      setOrders((current: Order[] | null) => [order, ...(current ?? [])]);
      setCartLines([]);
      loadProducts(); // the order took items out of stock
      return order;
    } catch (error) {
      endIfSignedOut(error);
      if (error instanceof ApiError && error.status === 409) loadProducts(); // stock ran out: show what's left
      throw error;
    }
  };

  // A 401 means the session ended (signed out, or the password changed elsewhere): sign in again.
  const endIfSignedOut = (error: unknown): void => {
    if (error instanceof ApiError && error.status === 401) setUser(null);
  };

  // These two reject with the API's message for the profile forms to show.
  const saveName = async (name: string): Promise<void> => {
    try {
      const { user: saved } = await api<{ user: User }>('/me', { method: 'PUT', body: { name } });
      setUser(saved);
    } catch (error) {
      endIfSignedOut(error);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await api('/me/password', { method: 'PUT', body: { currentPassword, newPassword } });
    } catch (error) {
      endIfSignedOut(error);
      throw error;
    }
  };

  // Only a Processing order can be cancelled; its items go back in stock.
  const cancelOrder = async (id: string): Promise<void> => {
    try {
      const { order } = await api<{ order: Order }>(`/orders/${id}/cancel`, { method: 'POST', body: {} });
      setOrders((current: Order[] | null) => current && current.map((placed: Order) => (placed.id === id ? order : placed)));
      loadProducts();
      notify(`Order #${id} cancelled`);
    } catch (error) {
      endIfSignedOut(error);
      notify((error as ApiError).message, { error: true });
    }
  };

  // Rejects with the API's message (wrong password, email taken…) for the form to show.
  const signIn = async ({ mode, name, email, password }: SignInDetails): Promise<void> => {
    const { user: signedIn } = await api<{ user: User }>(mode === 'login' ? '/auth/login' : '/auth/register', {
      method: 'POST',
      body: mode === 'login' ? { email, password } : { name, email, password },
    });
    setUser(signedIn);
    notify(`Welcome, ${signedIn.name.split(' ')[0]}`);
  };

  // From an emailed link: rejects with the API's message (an expired link…) for the page to show.
  const resetPassword = async (token: string, password: string): Promise<void> => {
    const { user: signedIn } = await api<{ user: User }>('/auth/reset-password', { method: 'POST', body: { token, password } });
    setUser(signedIn);
    notify('Your new password is saved and you’re signed in');
  };

  const signOut = async (): Promise<void> => {
    try {
      await api('/auth/logout', { method: 'POST', body: {} });
    } catch (error) {
      notify((error as ApiError).message, { error: true });
      return;
    }
    navigate('/');
    // React Router applies navigations as transitions. Clearing the user in the same transition
    // stops the account guard from seeing a signed-out user on /profile and redirecting to /login.
    startTransition(() => setUser(null));
    notify('You have been signed out');
  };

  // The switch moves at once; if the server can't save it, it moves back.
  const updatePreferences = (preferences: User['preferences']): void => {
    const previous = user?.preferences;
    setUser((current: User | null | undefined) => current && { ...current, preferences });
    api('/me/preferences', { method: 'PUT', body: preferences }).catch((error: ApiError) => {
      if (previous) setUser((current: User | null | undefined) => current && { ...current, preferences: previous });
      notify(error.message, { error: true });
    });
  };

  // Account pages wait until the session check (and the customer's orders and wishlist) have answered.
  const requireUser = (render: (currentUser: User) => ReactElement): ReactElement => {
    if (user === undefined || (user && (orders === null || wishlist === null))) return <PageStatus><Loading /></PageStatus>;
    return user ? render(user) : <Navigate to="/login" replace state={{ from: pathname }} />;
  };

  // Pages built from the catalogue wait for it, and offer to try again if it couldn't load.
  const withProducts = (render: (catalogue: Product[]) => ReactElement): ReactElement => {
    if (products) return render(products);
    return <PageStatus>{catalogueError ? <LoadError message={catalogueError} retry={loadProducts} /> : <Loading />}</PageStatus>;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header cartCount={cartCount} wishlistCount={wishlist?.length ?? 0} openCart={openCart} search={search} setSearch={setSearch} user={user ?? null} />
      <Routes>
        <Route
          path="/"
          element={<HomePage {...shopActions} products={products} catalogueError={catalogueError} reloadProducts={loadProducts} search={search} setSearch={setSearch} />}
        />
        <Route
          path="/product/:id"
          element={withProducts((catalogue: Product[]) => (
            <ProductPage {...shopActions} products={catalogue} openCart={openCart} user={user} reloadProducts={loadProducts} />
          ))}
        />
        <Route
          path="/checkout"
          element={requireUser((currentUser: User) =>
            withProducts(() => (
              <CheckoutPage
                cart={cart}
                cartTotal={cartTotal}
                user={currentUser}
                savedDelivery={orders?.[0]?.delivery}
                setQuantity={setQuantity}
                placeOrder={placeOrder}
              />
            )),
          )}
        />
        <Route path="/login" element={<LoginPage user={user} signIn={signIn} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage resetPassword={resetPassword} />} />
        <Route
          path="/profile"
          element={requireUser((currentUser: User) => (
            <ProfilePage
              user={currentUser}
              orders={orders ?? []}
              signOut={signOut}
              updatePreferences={updatePreferences}
              saveName={saveName}
              changePassword={changePassword}
            />
          ))}
        />
        <Route
          path="/wishlist"
          element={requireUser(() =>
            withProducts((catalogue: Product[]) => (
              <WishlistPage {...shopActions} products={(wishlist ?? []).flatMap((id: number) => catalogue.filter((product: Product) => product.id === id))} />
            )),
          )}
        />
        <Route path="/orders" element={requireUser(() => <OrdersPage orders={orders ?? []} buyAgain={buyAgain} cancelOrder={cancelOrder} />)} />
        <Route path="/orders/:id" element={requireUser(() => <OrderDetailsPage orders={orders ?? []} buyAgain={buyAgain} cancelOrder={cancelOrder} />)} />
        <Route path="/policies/:slug" element={<PolicyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
      <WhatsAppButton />
      {/* Above the WhatsApp button on phones, where a long message would reach it. */}
      <div aria-live="polite" className="print:hidden">
        {notice && (
          <div className="fixed bottom-24 left-1/2 z-50 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-lg bg-navy py-2 pl-4 pr-2 text-sm font-semibold text-white shadow-xl sm:bottom-5">
            {notice.error ? <CircleAlert size={17} className="shrink-0 text-rose-300" /> : <Check size={17} className="shrink-0 text-emerald-300" />}
            <span className="min-w-0 truncate">{notice.message}</span>
            {notice.action ? (
              <button onClick={notice.action.run} className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-bold text-navy transition hover:bg-brand-soft">
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
