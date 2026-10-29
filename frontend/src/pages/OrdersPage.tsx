import { useState } from 'react';
import { Link } from 'react-router';
import { PackageOpen, ShoppingBag, Truck } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatPrice } from '@/lib/pricing';
import type { Order, OrderItem, OrderStatus } from '@/types/store';

type OrdersPageProps = { orders: Order[]; buyAgain: (order: Order) => void; cancelOrder: (id: string) => Promise<void> };
type Filter = 'all' | OrderStatus;

const filters: [Filter, string][] = [
  ['all', 'All orders'],
  ['Processing', 'In progress'],
  ['Delivered', 'Delivered'],
  ['Cancelled', 'Cancelled'],
];

const statusStyles: Record<OrderStatus, string> = {
  Processing: 'bg-sky-50 text-[#0b6fce]',
  Delivered: 'bg-emerald-50 text-[#159a7a]',
  Cancelled: 'bg-slate-100 text-slate-500',
};

const deliveryLabels: Record<OrderStatus, string> = {
  Processing: 'Delivering to',
  Delivered: 'Delivered to',
  Cancelled: 'Was to be delivered to',
};

const formatDate = (iso: string): string => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const matchesFilter = (order: Order, filter: Filter): boolean => filter === 'all' || order.status === filter;

export function OrdersPage({ orders, buyAgain, cancelOrder }: OrdersPageProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [confirming, setConfirming] = useState<string | null>(null); // the order asking "cancel it?"
  const [cancelling, setCancelling] = useState(false);
  usePageTitle('My orders');
  const visibleOrders = orders.filter((order: Order) => matchesFilter(order, filter));

  const confirmCancel = async (id: string): Promise<void> => {
    setCancelling(true);
    await cancelOrder(id);
    setCancelling(false);
    setConfirming(null);
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
      <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#159a7a]">Your account</p>
          <h1 className="mt-2 text-4xl font-black text-[#082b62]">My orders</h1>
          <p className="mt-2 text-slate-500">Keep an eye on every essential headed your way.</p>
        </div>
        <Link to="/#products" className="flex items-center gap-2 self-start rounded-full bg-[#0b6fce] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#082b62]">
          <ShoppingBag size={16} /> Shop again
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-extrabold transition ${filter === value ? 'bg-[#082b62] text-white' : 'bg-white text-slate-500 hover:text-[#082b62]'}`}
          >
            {label} ({orders.filter((order: Order) => matchesFilter(order, value)).length})
          </button>
        ))}
      </div>
      {visibleOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <PackageOpen size={32} className="mx-auto text-[#0b6fce]" />
          <h2 className="mt-4 text-xl font-black text-[#082b62]">{orders.length === 0 ? 'No orders yet' : 'Nothing here yet'}</h2>
          <p className="mt-2 text-sm text-slate-500">{orders.length === 0 ? 'Your orders will appear here once you check out.' : 'No orders match this filter.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order: Order) => (
            <article key={order.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-black text-[#082b62]">Order #{order.id}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${statusStyles[order.status]}`}>{order.status}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-400">
                    Placed on {formatDate(order.placedAt)} · {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Card / UPI'}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total</p>
                  <p className="mt-1 text-lg font-black text-[#082b62]">{formatPrice(order.total)}</p>
                </div>
              </div>
              <ul className="divide-y divide-slate-100">
                {order.items.map((item: OrderItem) => (
                  <li key={item.id} className="flex items-center gap-4 py-4">
                    <img src={item.image} alt={item.name} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                    {/* Line total sits under the details on phones and on the right from sm up. */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <h3 className="font-extrabold leading-snug text-[#082b62]">{item.name}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-400">
                          {item.quantity} × {formatPrice(item.price)} · {item.unit}
                        </p>
                      </div>
                      <p className="shrink-0 font-black text-[#082b62]">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Truck size={16} className="shrink-0 text-[#0b6fce]" />
                  {deliveryLabels[order.status]} {order.delivery.name}, {order.delivery.city}
                </p>
                <div className="flex shrink-0 flex-wrap gap-2 self-start sm:self-auto">
                  {order.status === 'Processing' &&
                    (confirming === order.id ? (
                      <>
                        <button
                          onClick={() => void confirmCancel(order.id)}
                          disabled={cancelling}
                          className="rounded-full bg-rose-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-60"
                        >
                          {cancelling ? 'Cancelling…' : 'Yes, cancel order'}
                        </button>
                        <button
                          onClick={() => setConfirming(null)}
                          disabled={cancelling}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-500 transition hover:text-[#082b62]"
                        >
                          Keep it
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirming(order.id)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                      >
                        Cancel order
                      </button>
                    ))}
                  <button onClick={() => buyAgain(order)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-extrabold text-[#0b6fce] transition hover:bg-sky-50">
                    Buy again
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
