import { Link } from 'react-router';
import { CalendarDays, ChevronRight, IndianRupee, PackageOpen, Plus, Truck, type LucideIcon } from 'lucide-react';
import { LOW_STOCK, PageHeader, adminCard, adminMain, primaryButton, secondaryButton } from '@/components/AdminLayout';
import { LoadError, Loading } from '@/components/StoreShared';
import { useApiData } from '@/hooks/useApiData';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatDateTime } from '@/lib/format';
import { formatPrice } from '@/lib/pricing';
import type { AdminOrder, AdminOrderList, AdminSummary, Product, User } from '@/types/store';

const QUEUE_SHOWN = 6;

const plural = (count: number, word: string): string => `${count.toLocaleString('en-IN')} ${word}${count === 1 ? '' : 's'}`;

// The time of day in India, for the greeting.
const greeting = (): string => {
  const hour = Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }).format(new Date()));
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
};

function Stat({ label, value, note, icon: Icon, tone, to }: { label: string; value: string; note: string; icon: LucideIcon; tone: string; to?: string }) {
  const body = (
    <>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={20} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="mt-0.5 block text-2xl font-bold text-navy">{value}</span>
        <span className="block text-xs text-slate-500">{note}</span>
      </span>
    </>
  );
  const box = `${adminCard} flex items-start gap-3 p-4 sm:p-5`;
  return to ? (
    <Link to={to} className={`${box} transition hover:border-brand hover:shadow-md`}>
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}

function QueueRow({ order }: { order: AdminOrder }) {
  const pieces = order.items.reduce((count: number, item) => count + item.quantity, 0);
  return (
    <li>
      <Link to={`/admin/orders/${order.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-brand-soft/60 sm:px-5">
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-navy">
            #{order.id} · {order.delivery.name}
          </span>
          <span className="block truncate text-xs text-slate-500">
            {order.delivery.city} · {plural(pieces, 'item')} · placed {formatDateTime(order.placedAt)}
          </span>
        </span>
        <span className="shrink-0 font-bold text-navy">{formatPrice(order.total)}</span>
        <ChevronRight size={16} className="shrink-0 text-slate-400" />
      </Link>
    </li>
  );
}

// The admin home: what needs doing now (orders to pack and ship, stock running low) and how sales are going.
export function AdminDashboard({ products, user }: { products: Product[]; user: User }) {
  usePageTitle('Admin');
  const summary = useApiData<AdminSummary>('/admin/summary');
  const queue = useApiData<AdminOrderList>('/admin/orders?status=Processing');
  const lowStock = products.filter((product: Product) => product.stock <= LOW_STOCK).sort((a: Product, b: Product) => a.stock - b.stock || a.id - b.id);

  return (
    <main className={adminMain}>
      <PageHeader
        title={`${greeting()}, ${user.name.split(' ')[0]}`}
        description="Here’s what needs doing in the store."
        actions={
          <>
            <Link to="/admin/orders?status=Processing" className={secondaryButton}>
              <PackageOpen size={16} /> Orders to ship
            </Link>
            <Link to="/admin/products/new" className={primaryButton}>
              <Plus size={16} /> Add product
            </Link>
          </>
        }
      />
      {summary.error ? (
        <LoadError message={summary.error} retry={summary.reload} />
      ) : !summary.data ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="To pack and ship" value={String(summary.data.counts.Processing)} note="orders waiting" icon={PackageOpen} tone="bg-brand-soft text-brand" to="/admin/orders?status=Processing" />
          <Stat label="On the way" value={String(summary.data.counts.Shipped)} note="shipped, not yet delivered" icon={Truck} tone="bg-amber-50 text-amber-700" to="/admin/orders?status=Shipped" />
          <Stat label="Sales today" value={formatPrice(summary.data.today.sales)} note={plural(summary.data.today.orders, 'order')} icon={IndianRupee} tone="bg-leaf-soft text-leaf" />
          <Stat label="Last 30 days" value={formatPrice(summary.data.last30Days.sales)} note={plural(summary.data.last30Days.orders, 'order')} icon={CalendarDays} tone="bg-slate-100 text-slate-600" />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className={adminCard}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div>
              <h2 className="font-semibold text-navy">Orders to ship</h2>
              <p className="text-xs text-slate-500">Oldest first</p>
            </div>
            <Link to="/admin/orders?status=Processing" className="text-sm font-semibold text-brand hover:underline">
              See all
            </Link>
          </div>
          {queue.error ? (
            <div className="p-4">
              <LoadError message={queue.error} retry={queue.reload} />
            </div>
          ) : !queue.data ? (
            <Loading />
          ) : queue.data.orders.length === 0 ? (
            <p className="flex items-center gap-3 px-5 py-8 text-sm text-slate-500">
              <PackageOpen size={22} className="shrink-0 text-brand" /> Nothing to ship. New orders show up here.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {queue.data.orders.slice(0, QUEUE_SHOWN).map((order: AdminOrder) => (
                <QueueRow key={order.id} order={order} />
              ))}
            </ul>
          )}
        </section>

        <section className={adminCard}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div>
              <h2 className="font-semibold text-navy">Low stock</h2>
              <p className="text-xs text-slate-500">{LOW_STOCK} or fewer left</p>
            </div>
            <Link to="/admin/products?stock=low" className="text-sm font-semibold text-brand hover:underline">
              See all
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">Every product has more than {LOW_STOCK} in stock.</p>
          ) : (
            <ul className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
              {lowStock.map((product: Product) => (
                <li key={product.id}>
                  <Link to={`/admin/products/${product.id}`} className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-brand-soft/60 sm:px-5">
                    <img src={product.image} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 bg-white object-contain p-0.5" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{product.name}</span>
                    <span className={`shrink-0 text-sm font-bold ${product.stock === 0 ? 'text-rose-600' : 'text-amber-700'}`}>
                      {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
