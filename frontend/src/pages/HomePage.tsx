import { useMemo, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router';
import { ArrowRight, BadgeCheck, Building2, Check, Headset, Hospital, Landmark, MapPin, Phone, ShieldCheck, Stethoscope, Truck, type LucideIcon } from 'lucide-react';
import { AddToCart, LoadError, Loading, ProductCard, StockNote, WhatsAppIcon, type ShopActions } from '@/components/StoreShared';
import { categories } from '@/data/categories';
import { ADDRESS, MAP_LINK, PHONE, PHONE_LINK, whatsAppLink } from '@/data/contact';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatPrice } from '@/lib/pricing';
import type { Category, Product } from '@/types/store';

const ALL_PRODUCTS = 'All products' as const;

// The client's main line, shown as a price list right after the hero.
const SYRINGE_RANGE: Category[] = ['Syringes', 'Needles'];

const BULK_MESSAGE = 'Hello YourEcom, please share your bulk rate for syringes. Sizes and quantities I need: ';

type Sort = 'featured' | 'price-low' | 'price-high' | 'name';

const sortOptions: [Sort, string][] = [
  ['featured', 'Featured'],
  ['price-low', 'Price: low to high'],
  ['price-high', 'Price: high to low'],
  ['name', 'Name: A to Z'],
];

// 'featured' lists the categories in the store's order (syringes first), each in catalogue order (sort is stable).
const compareBy: Record<Sort, (a: Product, b: Product) => number> = {
  featured: (a: Product, b: Product) => categories.indexOf(a.category) - categories.indexOf(b.category),
  'price-low': (a: Product, b: Product) => a.price - b.price,
  'price-high': (a: Product, b: Product) => b.price - a.price,
  name: (a: Product, b: Product) => a.name.localeCompare(b.name),
};

// Who the client supplies and what they promise, from their posters.
const buyers: [LucideIcon, string][] = [
  [Landmark, 'Government hospitals'],
  [Hospital, 'Local hospitals'],
  [Stethoscope, 'Clinics and health centres'],
  [Building2, 'Institutions and organisations'],
];

const supplies = ['Syringes', 'Needles', 'IV sets', 'Face masks', 'Gloves', 'Bandages', 'Gauze and cotton', 'Surgical items'];

const promises: [LucideIcon, string, string][] = [
  [BadgeCheck, 'High quality products', 'Sterile, sealed and single-use, as medical disposables should be.'],
  [ShieldCheck, 'Hygienic and safe', 'Stored and packed with care, so every box reaches you clean.'],
  [Truck, 'Timely delivery', 'Orders go out on time, from a single box to a full consignment.'],
  [Headset, 'Customer support', 'Call or WhatsApp us about sizes, stock and bulk rates.'],
];

type HomePageProps = ShopActions & {
  products: Product[] | null; // null while the catalogue loads from the API
  catalogueError: string;
  reloadProducts: () => void;
  search: string;
  setSearch: (search: string) => void;
};

export function HomePage({ products, catalogueError, reloadProducts, search, setSearch, ...shop }: HomePageProps) {
  const [activeCategory, setActiveCategory] = useState<Category | typeof ALL_PRODUCTS>(ALL_PRODUCTS);
  const [sort, setSort] = useState<Sort>('featured');
  const query = search.trim().toLowerCase();
  const filtering = query !== '' || activeCategory !== ALL_PRODUCTS;
  usePageTitle();
  const filteredProducts = useMemo(
    () =>
      (products ?? [])
        .filter(
          (product: Product) =>
            (activeCategory === ALL_PRODUCTS || product.category === activeCategory) &&
            [product.name, product.category, product.description].some((text: string) => text.toLowerCase().includes(query)),
        )
        .sort(compareBy[sort]),
    [products, activeCategory, query, sort],
  );
  const syringeRange = useMemo(() => (products ?? []).filter((product: Product) => SYRINGE_RANGE.includes(product.category)).sort(compareBy.featured), [products]);

  const showAllProducts = (): void => {
    setActiveCategory(ALL_PRODUCTS);
    setSearch('');
  };

  const catalogueStatus = catalogueError ? <LoadError message={catalogueError} retry={reloadProducts} /> : <Loading label="Loading products…" />;

  return (
    <main>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-semibold text-leaf">Medical disposables wholesaler · New Delhi</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-navy sm:text-5xl">Disposable syringes for hospitals, clinics and government supply</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Sterile, single-use syringes from 0.5 ml to 50 ml, insulin syringes and needles, along with masks, gloves and dressings. Buy by the box here, or ask us for a
              bulk rate.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/#syringes" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-dark">
                See syringe range <ArrowRight size={18} />
              </Link>
              <a
                href={whatsAppLink(BULK_MESSAGE)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-6 py-3.5 font-semibold text-navy transition hover:border-navy"
              >
                <WhatsAppIcon size={19} className="text-whatsapp" /> Get a bulk rate
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
              {['Sterile, single-use', 'Wholesale and retail', 'Government and local supply'].map((point: string) => (
                <li key={point} className="flex items-center gap-2">
                  <Check size={16} className="text-leaf" /> {point}
                </li>
              ))}
            </ul>
          </div>
          <img
            className="h-72 w-full rounded-xl object-cover sm:h-96 lg:h-[440px]"
            src="https://images.pexels.com/photos/7722555/pexels-photo-7722555.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Sterile disposable syringes in sealed packs"
          />
        </div>
      </section>

      <section id="syringes" className="mx-auto max-w-7xl scroll-mt-32 px-5 py-14 md:scroll-mt-16 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-navy sm:text-3xl">Syringes and needles</h2>
            <p className="mt-2 max-w-2xl text-slate-600">Sterile and individually packed, sold by the box. Prices include taxes; for larger quantities, ask us for a bulk rate.</p>
          </div>
          <a href={whatsAppLink(BULK_MESSAGE)} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-brand hover:underline">
            <WhatsAppIcon size={16} className="text-whatsapp" /> Ask for a bulk rate
          </a>
        </div>
        {!products ? (
          <div className="mt-8">{catalogueStatus}</div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div aria-hidden="true" className="hidden grid-cols-[3.5rem_1fr_8rem_6rem_8.5rem] gap-x-5 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:grid">
              <span className="col-span-2">Product</span>
              <span>Pack</span>
              <span>Price</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {syringeRange.map((product: Product) => (
                <li key={product.id} className="grid grid-cols-[3.5rem_1fr] items-center gap-x-4 px-4 py-3 sm:grid-cols-[3.5rem_1fr_8rem_6rem_8.5rem] sm:gap-x-5 sm:px-5">
                  <img src={product.image} alt="" loading="lazy" className="h-14 w-14 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <Link to={`/product/${product.id}`} className="font-semibold leading-snug text-navy transition hover:text-brand">
                      {product.name}
                    </Link>
                    {product.badge && <span className="ml-2 inline-block rounded bg-leaf-soft px-1.5 py-0.5 align-middle text-[11px] font-semibold text-leaf">{product.badge}</span>}
                    <p className="mt-0.5 text-sm text-slate-500 sm:hidden">
                      {product.unit} · <span className="font-semibold text-navy">{formatPrice(product.price)}</span>
                    </p>
                    <StockNote stock={product.stock} className="mt-0.5" />
                  </div>
                  <p className="hidden text-sm text-slate-600 sm:block">{product.unit}</p>
                  <p className="hidden font-semibold text-navy sm:block">{formatPrice(product.price)}</p>
                  <div className="col-start-2 mt-2 sm:col-start-auto sm:mt-0 sm:justify-self-end">
                    <AddToCart product={product} {...shop} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section id="products" className="scroll-mt-32 border-y border-slate-200 bg-white py-14 md:scroll-mt-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h2 className="text-2xl font-semibold text-navy sm:text-3xl">All products</h2>
          <p className="mt-2 text-slate-600">Everything we stock, from syringes and needles to masks, gloves and dressings.</p>
          <div className="mb-8 mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              {[ALL_PRODUCTS, ...categories].map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                  className={`whitespace-nowrap rounded-lg border px-4 py-2 transition ${activeCategory === category ? 'border-navy bg-navy text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-navy hover:text-navy'}`}
                >
                  {category}
                </button>
              ))}
            </div>
            <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-500">
              Sort by
              <select
                value={sort}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setSort(event.target.value as Sort)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-navy outline-none transition focus:border-brand"
              >
                {sortOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {filtering && products && (
            <p className="-mt-3 mb-6 text-sm font-semibold text-slate-500">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              {activeCategory !== ALL_PRODUCTS && (
                <>
                  {' '}in <strong className="text-navy">{activeCategory}</strong>
                </>
              )}
              {query && (
                <>
                  {' '}for “<strong className="text-navy">{search.trim()}</strong>”
                </>
              )}
              <button onClick={showAllProducts} className="-my-1 ml-3 py-1 font-semibold text-brand hover:underline">
                Clear filters
              </button>
            </p>
          )}
          {!products ? (
            catalogueStatus
          ) : filteredProducts.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} {...shop} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              <p>No products match your search. Try another term or category.</p>
              <button onClick={showAllProducts} className="mt-5 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">
                Show all products
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-navy sm:text-3xl">Government and local supply</h2>
            <p className="mt-3 max-w-xl leading-7 text-slate-600">
              We supply all types of medical disposables to government hospitals and institutions. Local supply to hospitals, clinics and health centres is also available.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {buyers.map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy">
                  <Icon size={20} className="shrink-0 text-brand" /> {label}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <h3 className="font-semibold text-navy">We supply all types of medical disposables</h3>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-slate-700">
              {supplies.map((supply: string) => (
                <li key={supply} className="flex items-center gap-2.5">
                  <Check size={16} className="shrink-0 text-leaf" /> {supply}
                </li>
              ))}
            </ul>
            <a href={whatsAppLink()} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
              <WhatsAppIcon size={16} className="text-whatsapp" /> Ask about a product
            </a>
          </div>
        </div>
        <ul className="mt-12 grid gap-6 border-t border-slate-200 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map(([Icon, title, text]) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Icon size={21} />
              </span>
              <div>
                <h3 className="font-semibold text-navy">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="contact" className="scroll-mt-32 bg-navy md:scroll-mt-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">Buying in bulk?</h2>
            <p className="mt-3 max-w-xl leading-7 text-blue-100">
              Send us the sizes and quantities you need on WhatsApp, or call us. We will share a quotation for your hospital, clinic or institution.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsAppLink(BULK_MESSAGE)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 font-semibold text-navy transition hover:bg-brand-soft"
              >
                <WhatsAppIcon size={19} className="text-whatsapp" /> WhatsApp for a quote
              </a>
              <a href={PHONE_LINK} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">
                <Phone size={18} /> Call {PHONE}
              </a>
            </div>
          </div>
          <address className="rounded-xl border border-white/15 bg-white/5 p-6 not-italic text-blue-100">
            <p className="font-display text-lg font-semibold text-white">YourEcom</p>
            <p className="text-sm">Medical disposable wholesaler</p>
            <p className="mt-4 flex gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-blue-300" />
              <span>
                {ADDRESS[0]}
                <br />
                {ADDRESS[1]}
              </span>
            </p>
            <a href={MAP_LINK} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:underline">
              Get directions <ArrowRight size={15} />
            </a>
          </address>
        </div>
      </section>
    </main>
  );
}
