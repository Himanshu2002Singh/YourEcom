import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import { ProductCard, panel, type ShopActions } from '@/components/StoreShared';
import { categories } from '@/data/categories';
import { usePageTitle } from '@/hooks/usePageTitle';
import { byCategory, categoryPath, discountOf, groupByFamily, matchesSearch, type ProductGroup } from '@/lib/catalogue';
import type { Category, Product } from '@/types/store';

type Sort = 'relevance' | 'price-low' | 'price-high' | 'discount';

const sorts: [Sort, string][] = [
  ['relevance', 'Relevance'],
  ['price-low', 'Price: Low to High'],
  ['price-high', 'Price: High to Low'],
  ['discount', 'Discount'],
];

// Price bands for the filter, matched against each size's own price.
const priceBands: [string, string, number, number][] = [
  ['under-300', 'Under ₹300', 0, 299],
  ['300-600', '₹300 – ₹600', 300, 600],
  ['600-1000', '₹601 – ₹1,000', 601, 1000],
  ['over-1000', 'Over ₹1,000', 1001, Infinity],
];

const lowestPrice = (group: ProductGroup): number => Math.min(...group.map((product: Product) => product.price));
const bestDiscount = (group: ProductGroup): number => Math.max(...group.map(discountOf));

const compareGroups: Record<Sort, (a: ProductGroup, b: ProductGroup) => number> = {
  relevance: (a: ProductGroup, b: ProductGroup) => byCategory(a[0], b[0]),
  'price-low': (a: ProductGroup, b: ProductGroup) => lowestPrice(a) - lowestPrice(b),
  'price-high': (a: ProductGroup, b: ProductGroup) => lowestPrice(b) - lowestPrice(a),
  discount: (a: ProductGroup, b: ProductGroup) => bestDiscount(b) - bestDiscount(a),
};

type ProductsPageProps = ShopActions & { products: Product[] };

// Search results and category pages: /products?q=…&category=…&price=…&stock=in&sort=…, all optional.
// Filters work on sizes, so a family card only offers the sizes that match.
export function ProductsPage({ products, ...shop }: ProductsPageProps) {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = (params.get('q') ?? '').trim();
  const category = categories.find((name) => name === params.get('category')) ?? null;
  const sort = sorts.find(([value]) => value === params.get('sort'))?.[0] ?? 'relevance';
  const band = priceBands.find(([value]) => value === params.get('price')) ?? null;
  const inStockOnly = params.get('stock') === 'in';
  const heading = query ? `Results for “${query}”` : (category ?? 'All products');
  usePageTitle(heading);

  const term = query.toLowerCase();
  const matching = products.filter(
    (product: Product) => matchesSearch(product, term) && (!band || (product.price >= band[2] && product.price <= band[3])) && (!inStockOnly || product.stock > 0),
  );
  const countIn = (name: Category): number => groupByFamily(matching.filter((product: Product) => product.category === name)).length;
  const shown = groupByFamily(matching.filter((product: Product) => !category || product.category === category)).sort(compareGroups[sort]);
  const filtered = Boolean(category || band || inStockOnly);

  const update = (key: string, value: string | null): void => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const clearFilters = (): void => setParams(query ? { q: query } : {});

  // Rendered once in the sidebar on wide screens and once in the panel under "Filters" on phones,
  // so each copy names its radio groups apart.
  const filters = (id: string) => (
    <div className="divide-y divide-slate-100 text-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-base font-bold text-slate-900">Filters</p>
        {filtered && (
          <button onClick={clearFilters} className="text-xs font-bold uppercase text-brand hover:underline">
            Clear all
          </button>
        )}
      </div>
      <fieldset className="px-4 py-3">
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Category</legend>
        {[null, ...categories].map((name: Category | null) => (
          <label key={name ?? 'all'} className="flex cursor-pointer items-center gap-2.5 py-1 text-slate-700 hover:text-brand">
            <input type="radio" name={`${id}-category`} checked={category === name} onChange={() => update('category', name)} className="accent-brand" />
            <span className="flex-1">{name ?? 'All categories'}</span>
            {name && <span className="text-xs text-slate-400">{countIn(name)}</span>}
          </label>
        ))}
      </fieldset>
      <fieldset className="px-4 py-3">
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Price</legend>
        {[null, ...priceBands].map((option) => (
          <label key={option?.[0] ?? 'any'} className="flex cursor-pointer items-center gap-2.5 py-1 text-slate-700 hover:text-brand">
            <input type="radio" name={`${id}-price`} checked={band?.[0] === option?.[0]} onChange={() => update('price', option?.[0] ?? null)} className="accent-brand" />
            {option?.[1] ?? 'Any price'}
          </label>
        ))}
      </fieldset>
      <div className="px-4 py-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Availability</p>
        <label className="flex cursor-pointer items-center gap-2.5 py-1 text-slate-700 hover:text-brand">
          <input type="checkbox" checked={inStockOnly} onChange={(event) => update('stock', event.target.checked ? 'in' : null)} className="accent-brand" />
          Exclude out of stock
        </label>
      </div>
    </div>
  );

  return (
    <main className="mx-auto max-w-[1400px] px-2 py-3 sm:px-4">
      <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 px-1 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand">
          Home
        </Link>
        <ChevronRight size={12} />
        {category && query ? (
          <Link to={categoryPath(category)} className="hover:text-brand">
            {category}
          </Link>
        ) : (
          <span className="text-slate-700">{category ?? 'All products'}</span>
        )}
      </nav>
      <div className="flex items-start gap-3">
        <aside aria-label="Filters" className={`${panel} sticky top-24 hidden w-64 shrink-0 lg:block`}>
          {filters('side')}
        </aside>
        <section className={`${panel} min-w-0 flex-1`}>
          <div className="border-b border-slate-100 px-4 pt-3">
            <h1 className="text-lg font-bold text-slate-900">{heading}</h1>
            <p className="text-xs text-slate-500">
              {shown.length} {shown.length === 1 ? 'product' : 'products'}
              {query && category && ` in ${category}`}
            </p>
            <div className="mt-2 flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
                className="mb-3 inline-flex h-9 items-center gap-2 rounded border border-slate-300 px-3 text-sm font-medium text-slate-700"
              >
                <SlidersHorizontal size={15} /> Filters{filtered ? ' (on)' : ''}
              </button>
              <label className="mb-3 flex h-9 items-center gap-2 rounded border border-slate-300 px-3 text-sm text-slate-500">
                Sort
                <select value={sort} onChange={(event) => update('sort', event.target.value === 'relevance' ? null : event.target.value)} className="bg-transparent font-medium text-slate-800 outline-none">
                  {sorts.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="hidden items-center gap-5 text-sm lg:flex" role="group" aria-label="Sort by">
              <span className="pb-2.5 font-bold text-slate-900">Sort by</span>
              {sorts.map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => update('sort', value === 'relevance' ? null : value)}
                  aria-pressed={sort === value}
                  className={`border-b-2 pb-2 ${sort === value ? 'border-brand font-bold text-brand' : 'border-transparent text-slate-600 hover:text-brand'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {filtersOpen && <div className="border-b border-slate-200 bg-slate-50 lg:hidden">{filters('panel')}</div>}
          {shown.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 sm:gap-3 sm:p-3 xl:grid-cols-4">
              {shown.map((group: ProductGroup) => (
                // Keyed by its sizes, so a card whose sizes change with the filters starts on the first one.
                <ProductCard key={group.map((product: Product) => product.id).join('-')} group={group} {...shop} />
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-lg font-bold text-slate-900">No products found</p>
              <p className="mt-1 text-sm text-slate-500">Try another word, or look through a category.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {filtered && (
                  <button onClick={clearFilters} className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark">
                    Clear filters
                  </button>
                )}
                {categories.map((name) => (
                  <Link key={name} to={categoryPath(name)} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:border-brand hover:text-brand">
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
