import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight, PackageOpen, ShoppingBag, Truck } from 'lucide-react';
import { OrderActions, OrderItemList, StatusPill } from '@/components/OrderParts';
import { usePageTitle } from '@/hooks/usePageTitle';
import { deliveryLabels, formatDate, paymentLabels } from '@/lib/format';
import { formatPrice } from '@/lib/pricing';
import type { Order, OrderStatus } from '@/types/store';

type OrdersPageProps = { orders: Order[]; buyAgain: (order: Order) => void; cancelOrder: (id: string) => Promise<void> };
type Filter = 'all' | OrderStatus;

const filters: [Filter, string][] = [
  ['all', 'All orders'],
  ['Processing', 'In progress'],
  ['Delivered', 'Delivered'],
  ['Cancelled', 'Cancelled'],
];

const matchesFilter = (order: Order, filter: Filter): boolean => filter === 'all' || order.status === filter;

export function OrdersPage({ orders, buyAgain, cancelOrder }: OrdersPageProps) {
  const [filter, setFilter] = useState<Filter>('all');
  usePageTitle('My orders');
  const visibleOrders = orders.filter((order: Order) => matchesFilter(order, filter));

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
      <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-leaf">Your account</p>
          <h1 className="mt-2 text-4xl font-semibold text-navy">My orders</h1>
          <p className="mt-2 text-slate-500">Keep an eye on every essential headed your way.</p>
        </div>
        <Link to="/#products" className="flex items-center gap-2 self-start rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy">
          <ShoppingBag size={16} /> Shop again
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${filter === value ? 'bg-navy text-white' : 'bg-white text-slate-500 hover:text-navy'}`}
          >
            {label} ({orders.filter((order: Order) => matchesFilter(order, value)).length})
          </button>
        ))}
      </div>
      {visibleOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <PackageOpen size={32} className="mx-auto text-brand" />
          <h2 className="mt-4 text-xl font-semibold text-navy">{orders.length === 0 ? 'No orders yet' : 'Nothing here yet'}</h2>
          <p className="mt-2 text-sm text-slate-500">{orders.length === 0 ? 'Your orders will appear here once you check out.' : 'No orders match this filter.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order: Order) => (
            <article key={order.id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-semibold text-navy">Order #{order.id}</h2>
                    <StatusPill status={order.status} />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-400">
                    Placed on {formatDate(order.placedAt)} · {paymentLabels[order.paymentMethod]}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total</p>
                  <p className="mt-1 text-lg font-bold text-navy">{formatPrice(order.total)}</p>
                  {order.discount > 0 && (
                    <p className="text-xs font-bold text-leaf">
                      Saved {formatPrice(order.discount)} with {order.couponCode}
                    </p>
                  )}
                </div>
              </div>
              <OrderItemList items={order.items} />
              <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Truck size={16} className="shrink-0 text-brand" />
                  {deliveryLabels[order.status]} {order.delivery.name}, {order.delivery.city}
                </p>
                <div className="flex shrink-0 flex-wrap gap-2 self-start sm:self-auto">
                  <OrderActions order={order} buyAgain={buyAgain} cancelOrder={cancelOrder} />
                  <Link
                    to={`/orders/${order.id}`}
                    aria-label={`Details and invoice for order ${order.id}`}
                    className="flex items-center gap-1 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand"
                  >
                    Details <ChevronRight size={15} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
