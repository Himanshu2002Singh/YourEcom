import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { Menu, Plus, Search, ShoppingCart, UserRound, X } from 'lucide-react';
import { FREE_DELIVERY_THRESHOLD, formatPrice } from '@/lib/pricing';
import type { Product, User } from '@/types/store';

type HeaderProps = { cartCount: number; openCart: () => void; search: string; setSearch: (search: string) => void; user: User | null };
type ProductCardProps = { product: Product; addToCart: (product: Product, quantity?: number) => void };

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

export function Header({ cartCount, openCart, search, setSearch, user }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const accountPath = user ? '/profile' : '/login';
  const closeMenu = (): void => setMenuOpen(false);

  const showProducts = (): void => {
    closeMenu();
    if (pathname === '/') document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    else navigate('/#products');
  };

  // Results only render on the home page, so searching from any other page takes you there.
  const updateSearch = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearch(event.target.value);
    if (pathname !== '/') navigate('/#products');
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    showProducts();
  };

  return (
    <>
      <div className="bg-[#082b62] px-4 py-2 text-center text-xs font-semibold tracking-wide text-white sm:text-sm">
        <span className="mr-2 inline-block rounded-full bg-[#c9f23b] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#082b62]">Bulk orders</span>
        Free delivery on orders above {formatPrice(FREE_DELIVERY_THRESHOLD)}
        <span className="hidden sm:inline">
          <span className="mx-2 text-white/40">|</span> Trusted by 500+ healthcare partners
        </span>
      </div>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 lg:px-8">
          <Logo onClick={closeMenu} />
          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 lg:flex">
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
          <div className="flex items-center gap-3">
            <form role="search" onSubmit={submitSearch} className="hidden h-11 w-48 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 focus-within:border-[#0b6fce] focus-within:bg-white md:flex">
              <Search size={17} className="shrink-0 text-slate-400" />
              <input type="search" value={search} onChange={updateSearch} aria-label="Search supplies" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search supplies..." />
            </form>
            <button
              onClick={openCart}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-[#082b62] transition hover:border-[#0b6fce] hover:bg-sky-50"
              aria-label={`Open cart (${cartCount} ${cartCount === 1 ? 'item' : 'items'})`}
            >
              <ShoppingCart size={19} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff5f56] px-1 text-[10px] font-extrabold text-white">{cartCount}</span>
              )}
            </button>
            <Link to={accountPath} className="hidden h-11 items-center gap-2 rounded-full bg-[#eaf7ff] px-4 text-sm font-extrabold text-[#0b6fce] transition hover:bg-[#0b6fce] hover:text-white md:flex">
              <UserRound size={17} />
              <span className="max-w-28 truncate">{user ? user.name.split(' ')[0] : 'Sign in'}</span>
            </Link>
            <button className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-5 py-4 lg:hidden">
            <form role="search" onSubmit={submitSearch} className="mb-4 flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 md:hidden">
              <Search size={17} className="shrink-0 text-slate-400" />
              <input type="search" value={search} onChange={updateSearch} aria-label="Search supplies" className="w-full outline-none" placeholder="Search supplies..." />
            </form>
            <div className="grid gap-3 font-bold text-slate-600">
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
          </div>
        )}
      </header>
    </>
  );
}

export function ProductCard({ product, addToCart }: ProductCardProps) {
  const productPath = `/product/${product.id}`;
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link to={productPath} tabIndex={-1} aria-hidden="true" className="relative block h-52 overflow-hidden bg-slate-100">
        <img src={product.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {product.badge && <span className="absolute left-4 top-4 rounded-full bg-[#c9f23b] px-3 py-1 text-xs font-black text-[#082b62]">{product.badge}</span>}
      </Link>
      <div className="p-5">
        <Link to={productPath} className="block">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#159a7a]">{product.category}</p>
          <h3 className="mt-2 text-lg font-extrabold text-[#082b62] transition group-hover:text-[#0b6fce]">{product.name}</h3>
        </Link>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-xl font-black text-[#082b62]">{formatPrice(product.price)}</p>
            <p className="text-xs font-semibold text-slate-400">{product.unit}</p>
          </div>
          <button
            onClick={() => addToCart(product)}
            aria-label={`Add ${product.name} to cart`}
            className="flex items-center gap-2 rounded-full bg-[#e8f5ff] px-4 py-2.5 text-sm font-extrabold text-[#0b6fce] transition hover:bg-[#0b6fce] hover:text-white"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
    </article>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#061e45] px-5 py-5 text-center text-xs font-semibold text-blue-200">
      <p>
        © {new Date().getFullYear()} YourEcom. Quality · Trust · Care. <span className="mx-2 text-blue-500">•</span> Better everyday healthcare.
      </p>
    </footer>
  );
}
