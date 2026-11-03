import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ChevronRight, ExternalLink, Heart, Mail, MapPin, Menu, Package, Phone, Search, ShoppingCart, UserRound, X } from 'lucide-react';
import { WhatsAppIcon } from '@/components/StoreShared';
import { categories } from '@/data/categories';
import { ADDRESS, EMAIL, GSTIN, INDIAMART_LINK, MAP_LINK, PHONE, PHONE_LINK, whatsAppLink } from '@/data/contact';
import { categoryPath, groupByFamily, groupName, matchesSearch, type ProductGroup } from '@/lib/catalogue';
import type { Product, User } from '@/types/store';

type HeaderProps = {
  cartCount: number;
  wishlistCount: number;
  openCart: () => void;
  user: User | null;
  products: Product[] | null; // for search suggestions; null while the catalogue loads
};

const BULK_MESSAGE = 'Hello YourEcom, I would like a quotation for a bulk order. Products and quantities: ';

// The client's monogram from their business card: Y and E either side of a line that runs down through
// the hyphen of YOUR-ECOM. White, for the navy header and footer.
export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} aria-label="YourEcom home" className="relative flex shrink-0 flex-col items-center px-1 py-0.5 leading-none text-white">
      <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/85" />
      <span aria-hidden="true" className="flex gap-4 font-logo text-[1.7rem] leading-[1.05]">
        <span>Y</span>
        <span>E</span>
      </span>
      <span aria-hidden="true" className="mt-1 pl-[0.3em] text-[0.55rem] font-bold tracking-[0.3em]">YOUR-ECOM</span>
    </Link>
  );
}

const countBadge = (count: number, className = '-right-1.5 -top-1.5') =>
  count > 0 && (
    <span className={`absolute flex h-5 min-w-5 items-center justify-center rounded-full bg-cart px-1 text-[11px] font-bold text-navy ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  );

// A header link: a thin outline on hover, as on the big marketplaces.
const headerItem = 'flex items-center rounded border border-transparent px-1.5 py-1 transition hover:border-white/70';

// Search with suggestions: typing lists matching products (one per family); Enter or the button opens
// the results page, /products?q=…, optionally inside one category.
function SearchBox({ products, className }: { products: Product[] | null; className: string }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // On the results page the box shows the search that produced them.
  useEffect(() => {
    if (pathname !== '/products') return;
    const params = new URLSearchParams(search);
    setQuery(params.get('q') ?? '');
    setCategory(params.get('category') ?? '');
  }, [pathname, search]);

  const term = query.trim().toLowerCase();
  const suggestions = term ? groupByFamily((products ?? []).filter((product: Product) => matchesSearch(product, term))).slice(0, 6) : [];

  const finish = (): void => {
    setOpen(false);
    input.current?.blur();
  };

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    finish();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('category', category);
    navigate(`/products${params.toString() ? `?${params}` : ''}`);
  };

  const closeOnEscape = (event: KeyboardEvent<HTMLFormElement>): void => {
    if (event.key === 'Escape') finish();
  };

  return (
    <form role="search" onSubmit={submit} onKeyDown={closeOnEscape} className={`relative flex h-10 rounded-md bg-white text-slate-800 focus-within:ring-2 focus-within:ring-buy lg:h-11 ${className}`}>
      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        aria-label="Search in category"
        className="hidden max-w-36 shrink-0 cursor-pointer rounded-l-md border-r border-slate-300 bg-slate-100 px-2 text-xs text-slate-600 outline-none hover:bg-slate-200 lg:block"
      >
        <option value="">All categories</option>
        {categories.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <input
        ref={input}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label="Search products"
        placeholder="Search syringes, cannula, gloves, masks…"
        className="min-w-0 flex-1 rounded-l-md bg-transparent px-3 text-sm outline-none placeholder:text-slate-400 lg:rounded-none"
      />
      <button type="submit" aria-label="Search" className="flex w-12 shrink-0 items-center justify-center rounded-r-md bg-buy text-navy transition hover:bg-buy-dark">
        <Search size={20} />
      </button>
      {open && suggestions.length > 0 && (
        // preventDefault keeps focus in the box, so a click on a suggestion lands before the list closes.
        <div onMouseDown={(event) => event.preventDefault()} className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-xl">
          {suggestions.map((group: ProductGroup) => (
            <Link key={group[0].id} to={`/product/${group[0].id}`} onClick={finish} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100">
              <img src={group[0].image} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{group.length > 1 ? groupName(group[0]) : group[0].name}</span>
                <span className="block text-xs text-slate-500">in {group[0].category}</span>
              </span>
            </Link>
          ))}
          <button type="submit" className="flex w-full items-center gap-3 border-t border-slate-100 px-3 py-2.5 text-left text-sm font-medium text-brand hover:bg-slate-100">
            <Search size={16} /> See all results for “{query.trim()}”
          </button>
        </div>
      )}
    </form>
  );
}

export function Header({ cartCount, wishlistCount, openCart, user, products }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname, search } = useLocation();
  const activeCategory = pathname === '/products' ? new URLSearchParams(search).get('category') : null;
  const accountPath = user ? '/profile' : '/login';
  const greeting = user ? `Hello, ${user.name.split(' ')[0]}` : 'Hello, sign in';
  const closeMenu = (): void => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const menuSections: [string, [string, string][]][] = [
    ['Shop by category', categories.map((category): [string, string] => [category, categoryPath(category)])],
    [
      'Your account',
      [
        [user ? 'My account' : 'Sign in / Create account', accountPath],
        ['My orders', '/orders'],
        ['Wishlist', '/wishlist'],
      ],
    ],
    [
      'Help',
      [
        ['About YourEcom', '/about'],
        ['Shipping and delivery', '/policies/shipping'],
        ['Returns and refunds', '/policies/returns'],
      ],
    ],
  ];

  return (
    <>
      {/* Not sticky on short screens (phones in landscape), where it would cover a large part of the page. */}
      <header className="sticky top-0 z-30 bg-navy text-white shadow-md print:hidden [@media(max-height:500px)]:static">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-1 gap-y-2 px-2 py-2 sm:gap-x-2 sm:px-4 lg:flex-nowrap">
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className={`${headerItem} lg:hidden`}>
            <Menu size={24} />
          </button>
          <Logo onClick={closeMenu} />
          <SearchBox products={products} className="order-last w-full lg:order-none lg:mx-3 lg:w-auto lg:flex-1" />
          <a href={PHONE_LINK} className={`${headerItem} hidden flex-col items-start text-xs leading-tight xl:flex`}>
            <span className="text-blue-200">Call / WhatsApp</span>
            <span className="text-sm font-bold">{PHONE}</span>
          </a>
          <Link to={accountPath} className={`${headerItem} ml-auto gap-1.5 lg:ml-0`} aria-label={user ? `My account (${greeting})` : 'Sign in'}>
            <UserRound size={22} className="sm:hidden" />
            <span className="hidden flex-col text-xs leading-tight sm:flex">
              <span className="max-w-32 truncate text-blue-200">{greeting}</span>
              <span className="text-sm font-bold">Account</span>
            </span>
          </Link>
          <Link to="/orders" className={`${headerItem} hidden flex-col items-start text-xs leading-tight md:flex`}>
            <span className="text-blue-200">Returns</span>
            <span className="text-sm font-bold">&amp; Orders</span>
          </Link>
          <Link to="/wishlist" className={`${headerItem} relative`} aria-label={`Wishlist (${wishlistCount} ${wishlistCount === 1 ? 'item' : 'items'})`}>
            <Heart size={22} />
            {countBadge(wishlistCount, '-right-0.5 -top-0.5')}
          </Link>
          <button onClick={openCart} className={`${headerItem} relative gap-1.5`} aria-label={`Open cart (${cartCount} ${cartCount === 1 ? 'item' : 'items'})`}>
            <span className="relative">
              <ShoppingCart size={24} />
              {countBadge(cartCount)}
            </span>
            <span className="hidden text-sm font-bold sm:block">Cart</span>
          </button>
        </div>
      </header>
      <nav aria-label="Categories" className="bg-brand text-white print:hidden">
        {/* Below xl the categories don't all fit: the bar scrolls sideways, and its right edge fades to say so. */}
        <div className="mx-auto flex max-w-[1400px] items-center gap-0.5 overflow-x-auto px-1 text-sm scrollbar-none max-xl:[mask-image:linear-gradient(to_right,black_88%,transparent)] sm:px-3">
          <Link to="/products" className={`whitespace-nowrap rounded px-2.5 py-2 font-bold transition hover:bg-white/15 ${pathname === '/products' && !activeCategory ? 'bg-white/15' : ''}`}>
            All products
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              to={categoryPath(category)}
              aria-current={activeCategory === category ? 'page' : undefined}
              className={`whitespace-nowrap rounded px-2.5 py-2 font-medium transition hover:bg-white/15 ${activeCategory === category ? 'bg-white/15' : ''}`}
            >
              {category}
            </Link>
          ))}
          {/* An extra stop past the fade, so the last category can scroll fully into view. */}
          <span aria-hidden="true" className="w-10 shrink-0 xl:hidden" />
        </div>
      </nav>
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={closeMenu} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-navy px-4 py-4 text-white">
              <Link to={accountPath} onClick={closeMenu} className="flex items-center gap-2 text-lg font-bold">
                <UserRound size={22} /> {greeting}
              </Link>
              <button onClick={closeMenu} aria-label="Close menu" className="rounded p-1 hover:bg-white/10">
                <X size={22} />
              </button>
            </div>
            {menuSections.map(([title, links]) => (
              <div key={title} className="border-b border-slate-200 py-2">
                <p className="px-4 py-2 text-base font-bold text-slate-900">{title}</p>
                {links.map(([label, to]) => (
                  <Link key={to} to={to} onClick={closeMenu} className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100">
                    {label} <ChevronRight size={16} className="text-slate-400" />
                  </Link>
                ))}
              </div>
            ))}
            <div className="grid gap-1 py-3 text-sm">
              <a href={PHONE_LINK} className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-100">
                <Phone size={17} className="text-brand" /> Call {PHONE}
              </a>
              <a href={whatsAppLink(BULK_MESSAGE)} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-100">
                <WhatsAppIcon size={17} className="text-whatsapp" /> Bulk order on WhatsApp
              </a>
              <Link to="/orders" onClick={closeMenu} className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-100">
                <Package size={17} className="text-brand" /> Track my orders
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
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
  ['Shop', categories.map((category): [string, string] => [category, categoryPath(category)])],
  [
    'Your account',
    [
      ['My account', '/profile'],
      ['My orders', '/orders'],
      ['Wishlist', '/wishlist'],
    ],
  ],
  [
    'Help',
    [
      ['About YourEcom', '/about'],
      ['Shipping and delivery', '/policies/shipping'],
      ['Returns and refunds', '/policies/returns'],
      ['Privacy policy', '/policies/privacy'],
      ['Terms of use', '/policies/terms'],
    ],
  ],
];

export function Footer() {
  return (
    <footer className="mt-8 text-sm print:hidden">
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="block w-full bg-brand py-3.5 text-center font-medium text-white transition hover:bg-brand-dark">
        Back to top
      </button>
      <div className="bg-navy text-blue-100/85">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <div className="w-fit">
              <Logo />
            </div>
            <p className="mt-5 max-w-sm leading-6">
              Medical disposable wholesaler in New Delhi: syringes, IV cannula and sets, gloves, masks and more, for wholesale, retail, government and local supply.
            </p>
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
              <a href={`mailto:${EMAIL}`} className="flex items-center gap-3 transition hover:text-white">
                <Mail size={17} className="shrink-0" /> {EMAIL}
              </a>
              <a href={whatsAppLink()} target="_blank" rel="noreferrer" className="flex items-center gap-3 transition hover:text-white">
                <WhatsAppIcon size={17} /> Chat on WhatsApp
              </a>
            </address>
            <p className="mt-5 text-xs">
              GSTIN <span className="font-bold text-white">{GSTIN}</span>
              <span aria-hidden="true"> · </span>
              <a href={INDIAMART_LINK} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition hover:text-white hover:underline">
                IndiaMART profile <ExternalLink size={12} />
              </a>
            </p>
          </div>
          {footerLinks.map(([title, links]) => (
            <nav key={title} aria-label={title}>
              <p className="font-bold text-white">{title}</p>
              <ul className="mt-4 space-y-2.5">
                {links.map(([label, to]) => (
                  <li key={to}>
                    <Link to={to} className="transition hover:text-white hover:underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="bg-navy-dark text-blue-100/80">
        {/* Room on the right for the WhatsApp button, which floats over this bar at the bottom of the page. */}
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-5 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:pr-24 lg:px-8 lg:pr-24">
          <p>© {new Date().getFullYear()} YourEcom. All rights reserved.</p>
          <p>
            Designed and developed by <span className="font-bold text-white">Trusting Brains</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
