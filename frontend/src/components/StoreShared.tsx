import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { Heart, LoaderCircle, Mail, Menu, Phone, Plus, Search, ShoppingCart, Star, UserRound, X } from 'lucide-react';
import { QuantityStepper } from '@/components/QuantityStepper';
import { FREE_DELIVERY_THRESHOLD, formatPrice } from '@/lib/pricing';
import type { Product, User } from '@/types/store';

type HeaderProps = { cartCount: number; wishlistCount: number; openCart: () => void; search: string; setSearch: (search: string) => void; user: User | null };

// What product cards and pages can do with the cart and the wishlist (App.tsx keeps both).
export type ShopActions = {
  quantityOf: (id: number) => number;
  addToCart: (product: Product) => void;
  setQuantity: (id: number, quantity: number) => void;
  isSaved: (id: number) => boolean;
  toggleSaved: (product: Product) => void;
};

const countBadge = (count: number) =>
  count > 0 && (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff5f56] px-1 text-[10px] font-extrabold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );

const navLinkClass = ({ isActive }: { isActive: boolean }): string => (isActive ? 'text-[#0b6fce]' : 'transition hover:text-[#0b6fce]');

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} className="flex shrink-0 items-center gap-2 text-left" aria-label="YourEcom home">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0b6fce] text-2xl font-black text-white shadow-lg shadow-blue-200">+</span>
      <span className="leading-none">
        <strong className="block text-2xl font-extrabold tracking-[-0.07em] text-[#082b62]">
          Your<span className="text-[#088ee8]">Ecom</span>
        </strong>
        <small className="mt-1 block text-[9px] font-bold uppercase tracking-[0.25em] text-[#159a7a]">Quality · Trust · Care</small>
      </span>
    </Link>
  );
}

export function Header({ cartCount, wishlistCount, openCart, search, setSearch, user }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const accountPath = user ? '/profile' : '/login';
  const accountLabel = user ? user.name.split(' ')[0] : 'Sign in';
  const closeMenu = (): void => setMenuOpen(false);

  const showProducts = (): void => {
    closeMenu();
    navigate('/#products');
  };

  // Results only render on the home page: searching from another page goes there, and on the home
  // page the product grid is brought into view if it is off screen.
  const updateSearch = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearch(event.target.value);
    if (pathname !== '/') {
      navigate('/#products');
      return;
    }
    const grid = document.getElementById('products');
    const box = grid?.getBoundingClientRect();
    if (box && (box.top > window.innerHeight * 0.6 || box.bottom < 200)) grid?.scrollIntoView({ behavior: 'smooth' });
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    event.currentTarget.querySelector('input')?.blur();
    showProducts();
  };

  const searchForm = (className: string) => (
    <form role="search" onSubmit={submitSearch} className={`h-11 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 focus-within:border-[#0b6fce] focus-within:bg-white ${className}`}>
      <Search size={17} className="shrink-0 text-slate-400" />
      <input
        type="search"
        value={search}
        onChange={updateSearch}
        aria-label="Search supplies"
        className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
        placeholder="Search supplies..."
      />
    </form>
  );

  return (
    <>
      <div className="bg-[#082b62] px-4 py-2 text-center text-xs font-semibold tracking-wide text-white sm:text-sm">
        <span className="mr-2 inline-block rounded-full bg-[#c9f23b] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#082b62]">Bulk orders</span>
        Free delivery<span className="max-[399px]:hidden"> on orders</span> above {formatPrice(FREE_DELIVERY_THRESHOLD)}
        <span className="hidden md:inline">
          <span className="mx-2 text-white/40">|</span> Trusted by 500+ healthcare partners
        </span>
      </div>
      {/* Not sticky on short screens (phones in landscape), where it would cover a large part of the page. */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md [@media(max-height:500px)]:static">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:gap-5 lg:px-8">
          <Logo onClick={closeMenu} />
          <nav className="hidden items-center gap-6 whitespace-nowrap text-sm font-bold text-slate-600 lg:flex">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <button className="transition hover:text-[#0b6fce]" onClick={showProducts}>
              Shop products
            </button>
            <NavLink to="/orders" className={navLinkClass}>
              My orders
            </NavLink>
            <NavLink to="/profile" className={navLinkClass}>
              Profile
            </NavLink>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            {searchForm('hidden w-48 md:flex lg:w-60')}
            <Link
              to="/wishlist"
              onClick={closeMenu}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-[#082b62] transition hover:border-[#0b6fce] hover:bg-sky-50"
              aria-label={`Wishlist (${wishlistCount} ${wishlistCount === 1 ? 'item' : 'items'})`}
            >
              <Heart size={19} />
              {countBadge(wishlistCount)}
            </Link>
            <button
              onClick={openCart}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-[#082b62] transition hover:border-[#0b6fce] hover:bg-sky-50"
              aria-label={`Open cart (${cartCount} ${cartCount === 1 ? 'item' : 'items'})`}
            >
              <ShoppingCart size={19} />
              {countBadge(cartCount)}
            </button>
            {/* Icon-only between lg and xl, where the desktop nav needs the room. */}
            <Link
              to={accountPath}
              aria-label={user ? `My account (${accountLabel})` : accountLabel}
              className="hidden h-11 items-center justify-center gap-2 rounded-full bg-[#eaf7ff] px-4 text-sm font-extrabold text-[#0b6fce] transition hover:bg-[#0b6fce] hover:text-white md:flex lg:w-11 lg:px-0 xl:w-auto xl:px-4"
            >
              <UserRound size={17} className="shrink-0" />
              <span className="max-w-28 truncate lg:hidden xl:block">{accountLabel}</span>
            </Link>
            <button className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <div className="px-5 pb-3 md:hidden">{searchForm('flex w-full')}</div>
        {menuOpen && (
          <div className="grid gap-3 border-t border-slate-100 bg-white px-5 py-4 font-bold text-slate-600 lg:hidden">
            <Link to="/" onClick={closeMenu}>
              Home
            </Link>
            <button className="text-left" onClick={showProducts}>
              Shop products
            </button>
            <Link to="/orders" onClick={closeMenu}>
              My orders
            </Link>
            <Link to={accountPath} onClick={closeMenu}>
              {user ? 'Profile' : 'Sign in / Create account'}
            </Link>
          </div>
        )}
      </header>
    </>
  );
}

const LOW_STOCK = 10;

// "Only 3 left" when stock runs low, "Out of stock" at none; nothing while there's plenty.
export function StockNote({ stock, className = '' }: { stock: number; className?: string }) {
  if (stock > LOW_STOCK) return null;
  return <p className={`text-xs font-extrabold ${stock === 0 ? 'text-rose-600' : 'text-amber-600'} ${className}`}>{stock === 0 ? 'Out of stock' : `Only ${stock} left`}</p>;
}

// Five stars filled to the nearest whole star of `rating`; the caller labels them.
export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star: number) => (
        <Star key={star} size={size} className={star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
      ))}
    </span>
  );
}

// ★★★★☆ 4.5 (12): shown once a product has its first review.
export function RatingSummary({ product, className = '' }: { product: Product; className?: string }) {
  if (product.rating === null) return null;
  const reviews = `${product.reviewCount} ${product.reviewCount === 1 ? 'review' : 'reviews'}`;
  return (
    <p role="img" aria-label={`Rated ${product.rating} out of 5 from ${reviews}`} className={`flex items-center gap-1.5 text-xs font-bold text-slate-500 ${className}`}>
      <Stars rating={product.rating} />
      <span aria-hidden="true">
        {product.rating.toFixed(1)} ({product.reviewCount})
      </span>
    </p>
  );
}

// The heart that saves a product to the wishlist, or takes it off again.
export function SaveButton({ product, saved, toggleSaved, large }: { product: Product; saved: boolean; toggleSaved: (product: Product) => void; large?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => toggleSaved(product)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={`flex shrink-0 items-center justify-center rounded-full bg-white transition ${large ? 'h-14 w-14 border-2 border-slate-200 hover:border-rose-300' : 'h-10 w-10 shadow-md hover:scale-105'} ${saved ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
    >
      <Heart size={large ? 21 : 18} className={saved ? 'fill-current' : ''} />
    </button>
  );
}

export function ProductCard({ product, quantityOf, addToCart, setQuantity, isSaved, toggleSaved }: ShopActions & { product: Product }) {
  const productPath = `/product/${product.id}`;
  const quantity = quantityOf(product.id);
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative">
        <Link to={productPath} tabIndex={-1} aria-hidden="true" className="relative block h-52 overflow-hidden bg-slate-100">
          <img src={product.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          {product.badge && <span className="absolute left-4 top-4 rounded-full bg-[#c9f23b] px-3 py-1 text-xs font-black text-[#082b62]">{product.badge}</span>}
        </Link>
        <div className="absolute right-4 top-4">
          <SaveButton product={product} saved={isSaved(product.id)} toggleSaved={toggleSaved} />
        </div>
      </div>
      <div className="p-5">
        <Link to={productPath} className="block">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#159a7a]">{product.category}</p>
          <h3 className="mt-2 text-lg font-extrabold text-[#082b62] transition group-hover:text-[#0b6fce]">{product.name}</h3>
        </Link>
        <RatingSummary product={product} className="mt-2" />
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xl font-black text-[#082b62]">{formatPrice(product.price)}</p>
            <p className="text-xs font-semibold text-slate-400">{product.unit}</p>
            <StockNote stock={product.stock} className="mt-1" />
          </div>
          {quantity > 0 ? (
            <QuantityStepper quantity={quantity} onChange={(next: number) => setQuantity(product.id, next)} label={product.name} max={product.stock} />
          ) : product.stock === 0 ? (
            <span className="flex h-10 items-center rounded-full bg-slate-100 px-5 text-sm font-extrabold text-slate-400">Sold out</span>
          ) : (
            <button
              onClick={() => addToCart(product)}
              aria-label={`Add ${product.name} to cart`}
              className="flex h-10 items-center gap-2 rounded-full bg-[#e8f5ff] px-5 text-sm font-extrabold text-[#0b6fce] transition hover:bg-[#0b6fce] hover:text-white"
            >
              <Plus size={16} /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// Shown while something waits for the API.
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <p role="status" className="flex items-center justify-center gap-3 py-16 font-bold text-slate-500">
      <LoaderCircle size={22} className="animate-spin text-[#0b6fce]" /> {label}
    </p>
  );
}

// Shown when the API couldn't answer, with a way to try again.
export function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl bg-white p-12 text-center text-slate-500">
      <p>{message}</p>
      <button onClick={retry} className="mt-5 rounded-full bg-[#0b6fce] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#082b62]">
        Try again
      </button>
    </div>
  );
}

const footerLinks: [string, [string, string][]][] = [
  [
    'Shop',
    [
      ['All products', '/#products'],
      ['Bulk orders', '/#bulk'],
      ['Why YourEcom', '/#why-us'],
    ],
  ],
  [
    'Your account',
    [
      ['My orders', '/orders'],
      ['Wishlist', '/wishlist'],
      ['My account', '/profile'],
    ],
  ],
];

export function Footer() {
  return (
    <footer className="bg-[#061e45] text-blue-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:px-8">
        <div>
          <p className="text-lg font-black text-white">YourEcom</p>
          <p className="mt-3 max-w-xs text-sm leading-6">Reliable medical disposables for hospitals, clinics and homes, delivered across India.</p>
        </div>
        {footerLinks.map(([title, links]) => (
          <nav key={title} aria-label={title}>
            <p className="text-sm font-black text-white">{title}</p>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold">
              {links.map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="transition hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div>
          <p className="text-sm font-black text-white">Help</p>
          <ul className="mt-4 space-y-2.5 text-sm font-semibold">
            <li>
              <a href="tel:+919643821551" className="inline-flex items-center gap-2 transition hover:text-white">
                <Phone size={15} /> +91 96438 21551
              </a>
            </li>
            <li>
              <a href="mailto:hello@yourecom.in" className="inline-flex items-center gap-2 transition hover:text-white">
                <Mail size={15} /> hello@yourecom.in
              </a>
            </li>
            <li>
              <Link to="/#contact" className="transition hover:text-white">
                Contact us
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 px-5 py-5 text-center text-xs font-semibold">
        © {new Date().getFullYear()} YourEcom. Quality · Trust · Care. <span className="mx-2 text-blue-500">•</span> Better everyday healthcare.
      </p>
    </footer>
  );
}
