import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PackageOpen, Search } from 'lucide-react';
import { PageHeader, Pagination, adminCard, adminMain } from '@/components/AdminLayout';
import { StatusPill } from '@/components/OrderParts';
import { BulkTag, LoadError, Loading } from '@/components/StoreShared';
import { useApiData } from '@/hooks/useApiData';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatDateTime, paymentLabels } from '@/lib/format';
import { formatPrice } from '@/lib/pricing';
import type { AdminOrder, AdminOrderList, OrderStatus } from '@/types/store';

// '' is every order. To ship comes first: it's the queue to work through, oldest first.
const tabs: [OrderStatus | '', string][] = [
  ['Processing', 'To ship'],
  ['Shipped', 'Shipped'],
  ['Delivered', 'Delivered'],
  ['Cancelled', 'Cancelled'],
  ['', 'All'],
];

const columns = 'md:grid md:grid-cols-[9.5rem_minmax(0,1fr)_5rem_8rem_7rem] md:items-center md:gap-4';

function OrderRow({ order }: { order: AdminOrder }) {
  const pieces = order.items.reduce((count: number, item) => count + item.quantity, 0);
  return (
    <li>
      <Link to={`/admin/orders/${order.id}`} className={`block px-4 py-3 transition hover:bg-brand-soft/60 sm:px-5 ${columns}`}>
        <span className="flex items-center justify-between gap-3 md:block">
          <span>
            <span className="block font-semibold text-navy">
              #{order.id}
              {/* Wholesale orders stand out in the queue. */}
              {order.items.some((item) => item.bulk) && <BulkTag className="ml-1.5 bg-brand-soft text-brand" />}
            </span>
            <span className="block text-xs text-slate-500">{formatDateTime(order.placedAt)}</span>
          </span>
          <span className="md:hidden">
            <StatusPill status={order.status} />
          </span>
        </span>
        <span className="mt-1 block min-w-0 md:mt-0">
          <span className="block truncate font-medium text-slate-700">{order.delivery.name}</span>
          <span className="block truncate text-xs text-slate-500">
            {order.delivery.city} – {order.delivery.pincode} · {order.delivery.phone}
          </span>
        </span>
        <span className="mt-1 flex items-baseline justify-between gap-3 md:contents">
          <span className="text-sm text-slate-500 md:text-right">
            {pieces} {pieces === 1 ? 'item' : 'items'}
          </span>
          <span className="text-right">
            <span className="block font-bold text-navy">{formatPrice(order.total)}</span>
            <span className="block text-xs text-slate-500">{paymentLabels[order.paymentMethod]}</span>
          </span>
        </span>
        <span className="hidden text-right md:block">
          <StatusPill status={order.status} />
        </span>
      </Link>
    </li>
  );
}

// Every customer's orders, a page at a time: a tab per status, and a search by order number, name, email,
// phone, city or pincode. The tab, search and page live in the address, so Back and shared links keep them.
export function AdminOrdersPage() {
  usePageTitle('Orders · Admin');
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const q = params.get('q') ?? '';
  const [text, setText] = useState(q);
  const list = useApiData<AdminOrderList>(`/admin/orders?${params.toString()}`);

  // Changes the address's filters; an empty value removes one. A new tab or search starts again at page 1.
  const change = useCallback(
    (values: Record<string, string>, replace = false): void => {
      setParams(
        (current: URLSearchParams) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(values)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          return next;
        },
        { replace },
      );
    },
    [setParams],
  );

  // Searches a moment after typing stops, replacing the address rather than adding to history for every letter.
  useEffect(() => {
    if (text.trim() === q) return;
    const timer = window.setTimeout(() => change({ q: text.trim(), page: '' }, true), 350);
    return () => window.clearTimeout(timer);
  }, [text, q, change]);

  const data = list.data;
  const all = data ? Object.values(data.counts).reduce((sum: number, count: number) => sum + count, 0) : 0;

  return (
    <main className={adminMain}>
      <PageHeader title="Orders" description="Every customer’s orders. To ship lists the oldest first, the order to pack them in." />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 lg:pb-0" role="tablist" aria-label="Order status">
          {tabs.map(([value, label]) => (
            <button
              key={label}
              role="tab"
              aria-selected={status === value}
              onClick={() => change({ status: value, page: '' })}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${status === value ? 'bg-navy text-white' : 'bg-white text-slate-600 shadow-sm hover:text-navy'}`}
            >
              {label}
              {data && <span className="ml-1.5 opacity-70">{value ? data.counts[value] : all}</span>}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm focus-within:border-brand lg:w-96">
          <Search size={17} className="shrink-0 text-slate-400" />
          <span className="sr-only">Search orders</span>
          <input
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Order no., name, phone, city or pincode"
            className="w-full min-w-0 bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-400"
          />
        </label>
      </div>

      <section className={`mt-4 ${adminCard}`}>
        <div className={`hidden border-b border-slate-100 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 ${columns}`}>
          <span>Order</span>
          <span>Deliver to</span>
          <span className="text-right">Items</span>
          <span className="text-right">Total</span>
          <span className="text-right">Status</span>
        </div>
        {list.error ? (
          <div className="p-4">
            <LoadError message={list.error} retry={list.reload} />
          </div>
        ) : !data ? (
          <Loading />
        ) : data.orders.length === 0 ? (
          <p className="flex items-center justify-center gap-3 px-5 py-12 text-sm text-slate-500">
            <PackageOpen size={22} className="shrink-0 text-brand" />
            {q ? `No orders match “${q}”.` : status ? `No ${tabs.find(([value]) => value === status)?.[1].toLowerCase()} orders.` : 'No orders yet.'}
          </p>
        ) : (
          <ul className={`divide-y divide-slate-100 transition-opacity ${list.loading ? 'opacity-50' : ''}`}>
            {data.orders.map((order: AdminOrder) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
        )}
      </section>

      {data && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPage={(number: number) => {
            change({ page: number > 1 ? String(number) : '' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </main>
  );
}
