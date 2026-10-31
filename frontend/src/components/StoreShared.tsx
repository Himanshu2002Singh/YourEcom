import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { Heart, LoaderCircle, MapPin, Menu, Phone, Plus, Search, ShoppingCart, Star, UserRound, X } from 'lucide-react';
import { QuantityStepper } from '@/components/QuantityStepper';
import { ADDRESS, MAP_LINK, PHONE, PHONE_LINK, whatsAppLink } from '@/data/contact';
import { formatPrice } from '@/lib/pricing';
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
    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );

const navLinkClass = ({ isActive }: { isActive: boolean }): string => (isActive ? 'text-brand' : 'transition hover:text-brand');

const iconButtonClass = 'relative flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-navy transition hover:border-brand hover:bg-brand-soft';

// A blue medical cross with a green leaf, after the client's logo. White on dark backgrounds.
// Below 360px the logo shrinks and drops its tagline so the header fits beside the cart and menu.
function LogoMark({ inverse }: { inverse?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className="h-8 w-8 shrink-0 min-[360px]:h-10 min-[360px]:w-10">
      <g className={inverse ? 'fill-white' : 'fill-brand'}>
        <rect x="14" y="4" width="12" height="32" rx="3" />
        <rect x="4" y="14" width="32" height="12" rx="3" />
      </g>
      <path d="M4 37c0-6.5 3.5-10 10-10 0 6.5-3.5 10-10 10Z" className="fill-leaf" />
      <path d="M5.5 35.5 12 29" className="stroke-white/70" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ onClick, inverse }: { onClick?: () => void; inverse?: boolean }) {
  return (
    <Link to="/" onClick={onClick} className="flex shrink-0 items-center gap-2 text-left min-[360px]:gap-2.5" aria-label="YourEcom home">
      <LogoMark inverse={inverse} />
      <span className="leading-none">
        <span className={`block font-display text-[1.3rem] font-semibold tracking-tight min-[360px]:text-[1.55rem] ${inverse ? 'text-white' : 'text-navy'}`}>
          Your<span className={inverse ? 'text-blue-300' : 'text-brand'}>Ecom</span>
        </span>
        <span className={`mt-1 hidden text-[10px] font-semibold uppercase tracking-widest min-[360px]:block ${inverse ? 'text-blue-200' : 'text-leaf'}`}>Quality · Trust · Care</span>
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
    <form role="search" onSubmit={submitSearch} className={`h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 focus-within:border-brand focus-within:bg-white ${className}`}>
      <Search size={17} className="shrink-0 text-slate-400" />
      <input
        type="search"
        value={search}
        onChange={updateSearch}
        aria-label="Search products"
        className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
        placeholder="Search products..."
      />
    </form>
  );

  const menuLinks: [string, string][] = [
    ['Syringes', '/#syringes'],
    ['All products', '/#products'],
    ['Bulk orders', '/#contact'],
  ];

  return (
    <>
      <div className="bg-navy text-xs text-blue-100 sm:text-sm print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-5 py-2 md:justify-between lg:px-8">
          <p className="hidden md:block">Wholesale · Retail · Government supply · Local supply</p>
          <a href={PHONE_LINK} className="inline-flex items-center gap-2 font-semibold text-white hover:underline">
            <Phone size={14} /> Call / WhatsApp {PHONE}
          </a>
        </div>
      </div>
      {/* Not sticky on short screens (phones in landscape), where it would cover a large part of the page. */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md print:hidden [@media(max-height:500px)]:static">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 min-[360px]:px-5 sm:gap-5 lg:px-8">
          <Logo onClick={closeMenu} />
          <nav className="hidden items-center gap-6 whitespace-nowrap text-sm font-semibold text-slate-600 lg:flex">
            {menuLinks.map(([label, to]) => (
              <Link key={to} to={to} className="transition hover:text-brand">
                {label}
              </Link>
            ))}
            <NavLink to="/orders" className={navLinkClass}>
              My orders
            </NavLink>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            {searchForm('hidden w-48 md:flex lg:w-52 xl:w-64')}
            <Link to="/wishlist" onClick={closeMenu} className={iconButtonClass} aria-label={`Wishlist (${wishlistCount} ${wishlistCount === 1 ? 'item' : 'items'})`}>
              <Heart size={19} />
              {countBadge(wishlistCount)}
            </Link>
            <button onClick={openCart} className={iconButtonClass} aria-label={`Open cart (${cartCount} ${cartCount === 1 ? 'item' : 'items'})`}>
              <ShoppingCart size={19} />
              {countBadge(cartCount)}
            </button>
            {/* Icon-only between lg and xl, where the desktop nav needs the room. */}
            <Link
              to={accountPath}
              aria-label={user ? `My account (${accountLabel})` : accountLabel}
              className="hidden h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark md:flex lg:w-11 lg:px-0 xl:w-auto xl:px-4"
            >
              <UserRound size={17} className="shrink-0" />
              <span className="max-w-28 truncate lg:hidden xl:block">{accountLabel}</span>
            </Link>
            <button className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <div className="px-4 pb-3 min-[360px]:px-5 md:hidden">{searchForm('flex w-full')}</div>
        {menuOpen && (
          <div className="grid gap-3 border-t border-slate-100 bg-white px-5 py-4 font-semibold text-slate-600 lg:hidden">
            {menuLinks.map(([label, to]) => (
              <Link key={to} to={to} onClick={closeMenu}>
                {label}
              </Link>
            ))}
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
  return <p className={`text-xs font-semibold ${stock === 0 ? 'text-rose-600' : 'text-amber-600'} ${className}`}>{stock === 0 ? 'Out of stock' : `Only ${stock} left`}</p>;
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
      className={`flex shrink-0 items-center justify-center bg-white transition ${large ? 'h-14 w-14 rounded-lg border-2 border-slate-200 hover:border-rose-300' : 'h-10 w-10 rounded-full shadow-md hover:scale-105'} ${saved ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
    >
      <Heart size={large ? 21 : 18} className={saved ? 'fill-current' : ''} />
    </button>
  );
}

// The Add button, or the quantity stepper once the product is in the cart.
export function AddToCart({ product, quantityOf, addToCart, setQuantity }: Pick<ShopActions, 'quantityOf' | 'addToCart' | 'setQuantity'> & { product: Product }) {
  const quantity = quantityOf(product.id);
  if (quantity > 0) return <QuantityStepper quantity={quantity} onChange={(next: number) => setQuantity(product.id, next)} label={product.name} max={product.stock} />;
  if (product.stock === 0) return <span className="flex h-10 shrink-0 items-center rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-400">Sold out</span>;
  return (
    <button
      onClick={() => addToCart(product)}
      aria-label={`Add ${product.name} to cart`}
      className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark"
    >
      <Plus size={16} /> Add
    </button>
  );
}

export function ProductCard({ product, isSaved, toggleSaved, ...cart }: ShopActions & { product: Product }) {
  const productPath = `/product/${product.id}`;
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-brand/40 hover:shadow-md">
      <div className="relative">
        <Link to={productPath} tabIndex={-1} aria-hidden="true" className="relative block h-48 overflow-hidden bg-slate-100">
          <img src={product.image} alt="" loading="lazy" className="h-full w-full object-cover" />
          {product.badge && <span className="absolute left-3 top-3 rounded-md bg-navy px-2.5 py-1 text-xs font-semibold text-white">{product.badge}</span>}
        </Link>
        <div className="absolute right-3 top-3">
          <SaveButton product={product} saved={isSaved(product.id)} toggleSaved={toggleSaved} />
        </div>
      </div>
      <div className="p-4">
        <Link to={productPath} className="block">
          <p className="text-xs font-semibold uppercase tracking-wider text-leaf">{product.category}</p>
          <h3 className="mt-1.5 font-semibold leading-snug text-navy transition group-hover:text-brand">{product.name}</h3>
        </Link>
        <RatingSummary product={product} className="mt-2" />
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-navy">{formatPrice(product.price)}</p>
            <p className="text-xs text-slate-500">{product.unit}</p>
            <StockNote stock={product.stock} className="mt-1" />
          </div>
          <AddToCart product={product} {...cart} />
        </div>
      </div>
    </article>
  );
}

// Shown while something waits for the API.
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <p role="status" className="flex items-center justify-center gap-3 py-16 font-bold text-slate-500">
      <LoaderCircle size={22} className="animate-spin text-brand" /> {label}
    </p>
  );
}

// Shown when the API couldn't answer, with a way to try again.
export function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className="rounded-xl bg-white p-12 text-center text-slate-500">
      <p>{message}</p>
      <button onClick={retry} className="mt-5 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy">
        Try again
      </button>
    </div>
  );
}

// WhatsApp's logo (lucide has no brand icons).
export function WhatsAppIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" className={`shrink-0 ${className ?? ''}`}>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.83 9.83 0 0 1 9.88 9.89c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41Z" />
    </svg>
  );
}

// The chat button in the corner of every page.
export function WhatsAppButton() {
  return (
    <a
      href={whatsAppLink()}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with YourEcom on WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition hover:scale-105 print:hidden"
    >
      <WhatsAppIcon size={28} />
    </a>
  );
}

const footerLinks: [string, [string, string][]][] = [
  [
    'Products',
    [
      ['Syringe range', '/#syringes'],
      ['All products', '/#products'],
      ['Bulk orders', '/#contact'],
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
  [
    'Policies',
    [
      ['Shipping and delivery', '/policies/shipping'],
      ['Returns and refunds', '/policies/returns'],
      ['Privacy policy', '/policies/privacy'],
      ['Terms of use', '/policies/terms'],
    ],
  ],
];

export function Footer() {
  return (
    <footer className="bg-navy-dark text-sm text-blue-100/80 print:hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo inverse />
          <p className="mt-5 max-w-sm leading-6">Wholesale and retail supplier of disposable syringes and medical consumables, for government and local supply.</p>
          <address className="mt-5 space-y-3 not-italic">
            <a href={MAP_LINK} target="_blank" rel="noreferrer" className="flex gap-3 transition hover:text-white">
              <MapPin size={17} className="mt-0.5 shrink-0" />
              <span>
                {ADDRESS[0]}
                <br />
                {ADDRESS[1]}
              </span>
            </a>
            <a href={PHONE_LINK} className="flex items-center gap-3 transition hover:text-white">
              <Phone size={17} className="shrink-0" /> {PHONE}
            </a>
            <a href={whatsAppLink()} target="_blank" rel="noreferrer" className="flex items-center gap-3 transition hover:text-white">
              <WhatsAppIcon size={17} /> Chat on WhatsApp
            </a>
          </address>
        </div>
        {footerLinks.map(([title, links]) => (
          <nav key={title} aria-label={title}>
            <p className="font-semibold text-white">{title}</p>
            <ul className="mt-4 space-y-2.5">
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
      </div>
      <div className="border-t border-white/10">
        {/* Room on the right for the WhatsApp button, which floats over this bar at the bottom of the page. */}
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:pr-24 lg:px-8 lg:pr-24">
          <p>© {new Date().getFullYear()} YourEcom. All rights reserved.</p>
          <p>
            Designed and developed by <span className="font-semibold text-white">Trusting Brains</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
