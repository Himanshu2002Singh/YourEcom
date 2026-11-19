import { Link, useSearchParams } from 'react-router';
import { ChevronRight, PackageSearch, Plus, Search } from 'lucide-react';
import { LOW_STOCK, PageHeader, Pagination, adminCard, adminMain, primaryButton } from '@/components/AdminLayout';
import { Price } from '@/components/StoreShared';
import { usePageTitle } from '@/hooks/usePageTitle';
import { matchesSearch, storeCategories } from '@/lib/catalogue';
import { formatPrice } from '@/lib/pricing';
import type { Product } from '@/types/store';

const PAGE_SIZE = 20;

type Stock = '' | 'low' | 'out';
const stockFilters: [Stock, string][] = [
  ['', 'All'],
  ['low', 'Low stock'],
  ['out', 'Out of stock'],
];
const inStockFilter = (product: Product, filter: Stock): boolean =>
  filter === 'low' ? product.stock <= LOW_STOCK : filter === 'out' ? product.stock === 0 : true;

// The bulk terms under the retail price, for a product sold in bulk too.
function BulkNote({ product }: { product: Product }) {
  if (!product.bulk) return null;
  return (
    <span className="block whitespace-nowrap text-xs font-semibold text-brand">
      Bulk {formatPrice(product.bulk.price)} + {product.bulk.gstRate}% · min {product.bulk.minQuantity}
    </span>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600">Out of stock</span>;
  if (stock <= LOW_STOCK) return <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{stock} left</span>;
  return <span className="text-sm text-slate-600">{stock.toLocaleString('en-IN')} in stock</span>;
}

const columns = 'md:grid md:grid-cols-[minmax(0,1fr)_11rem_9rem_1.5rem] md:items-center md:gap-6';

// The catalogue, a page at a time, with search, category and stock filters kept in the address (so Back, and the
// dashboard's low-stock links, land on the same view). Each row opens the product's own page to edit it.
export function AdminProductsPage({ products }: { products: Product[] }) {
  usePageTitle('Products · Admin');
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const stock = (params.get('stock') ?? '') as Stock;
  const shopCategories = storeCategories(products);

  // Changes the filters in the address; an empty value removes one. Any filter change starts again at page 1.
  const change = (values: Record<string, string>): void => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries({ page: '', ...values })) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: 'q' in values });
  };

  const query = search.trim().toLowerCase();
  const shown = products.filter(
    (product: Product) => (!category || product.category === category) && inStockFilter(product, stock) && matchesSearch(product, query),
  );
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(params.get('page')) || 1));
  const onPage = shown.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const count = (filter: Stock): number => products.filter((product: Product) => inStockFilter(product, filter)).length;

  return (
    <main className={adminMain}>
      <PageHeader
        title="Products"
        description={`${products.length} products in ${shopCategories.length} categories`}
        actions={
          <Link to="/admin/products/new" className={primaryButton}>
            <Plus size={16} /> Add product
          </Link>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm focus-within:border-brand">
          <Search size={17} className="shrink-0 text-slate-400" />
          <span className="sr-only">Search products</span>
          <input
            type="search"
            value={search}
            onChange={(event) => change({ q: event.target.value })}
            placeholder="Search by name, description or highlight"
            className="w-full min-w-0 bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-400"
          />
        </label>
        <select
          value={category}
          onChange={(event) => change({ category: event.target.value })}
          aria-label="Category"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none focus:border-brand"
        >
          <option value="">All categories</option>
          {shopCategories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm" role="group" aria-label="Stock">
          {stockFilters.map(([value, label]) => (
            <button
              key={label}
              onClick={() => change({ stock: value })}
              aria-pressed={stock === value}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold transition ${stock === value ? 'bg-navy text-white' : 'text-slate-600 hover:text-navy'}`}
            >
              {label}
              {value && <span className="ml-1.5 opacity-70">{count(value)}</span>}
            </button>
          ))}
        </div>
      </div>

      <section className={`mt-4 overflow-hidden ${adminCard}`}>
        <div className={`hidden border-b border-slate-100 bg-slate-50/60 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 ${columns}`}>
          <span>Product</span>
          <span>Price</span>
          <span>Stock</span>
          <span />
        </div>
        {onPage.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <PackageSearch size={30} className="text-brand" />
            <p className="mt-3 font-semibold text-navy">No products match</p>
            <p className="mt-1 text-sm text-slate-500">Try another search or filter, or add the product.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {onPage.map((product: Product) => (
              <li key={product.id}>
                <Link to={`/admin/products/${product.id}`} className={`flex items-center gap-4 px-4 py-3 transition hover:bg-brand-soft/50 sm:px-5 ${columns}`}>
                  <span className="flex min-w-0 flex-1 items-center gap-4">
                    <img src={product.image} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-slate-100 bg-white object-contain p-0.5" />
                    <span className="min-w-0">
                      <span className="block font-semibold leading-snug text-navy">{product.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        #{product.id} · {product.category} · {product.unit}
                        {product.badge && ` · ${product.badge}`}
                      </span>
                      {/* On phones price and stock sit under the name. */}
                      <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 md:hidden">
                        <Price product={product} className="text-sm [&>span:first-child]:text-base" />
                        <StockBadge stock={product.stock} />
                      </span>
                      <span className="md:hidden">
                        <BulkNote product={product} />
                      </span>
                    </span>
                  </span>
                  <span className="hidden md:block">
                    <Price product={product} className="[&>span:first-child]:text-base" />
                    <BulkNote product={product} />
                  </span>
                  <span className="hidden md:block">
                    <StockBadge stock={product.stock} />
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={shown.length}
        onPage={(number: number) => {
          change({ page: number > 1 ? String(number) : '' });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </main>
  );
}
