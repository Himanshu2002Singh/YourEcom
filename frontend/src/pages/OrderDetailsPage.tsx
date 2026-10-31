import { Link, useParams } from 'react-router';
import { ArrowLeft, Check, MapPin, Printer, Receipt, X } from 'lucide-react';
import { OrderActions, OrderItemList, StatusPill } from '@/components/OrderParts';
import { ADDRESS, PHONE } from '@/data/contact';
import { usePageTitle } from '@/hooks/usePageTitle';
import { deliveryLabels, formatDateTime, paymentLabels } from '@/lib/format';
import { formatPrice } from '@/lib/pricing';
import { NotFoundPage } from '@/pages/NotFoundPage';
import type { Order, OrderItem } from '@/types/store';

type OrderDetailsPageProps = { orders: Order[]; buyAgain: (order: Order) => void; cancelOrder: (id: string) => Promise<void> };
type Step = { label: string; detail?: string; state: 'done' | 'current' | 'upcoming' | 'cancelled' };

const stepStyles: Record<Step['state'], string> = {
  done: 'bg-leaf text-white',
  current: 'bg-brand text-white ring-4 ring-brand-soft',
  upcoming: 'bg-slate-100 text-slate-400',
  cancelled: 'bg-rose-100 text-rose-600',
};

// Placed, then Processing until it is Delivered; or Cancelled.
function OrderProgress({ order }: { order: Order }) {
  const delivered = order.status === 'Delivered';
  const steps: Step[] =
    order.status === 'Cancelled'
      ? [
          { label: 'Order placed', detail: formatDateTime(order.placedAt), state: 'done' },
          { label: 'Cancelled', detail: 'Nothing will be delivered or charged', state: 'cancelled' },
        ]
      : [
          { label: 'Order placed', detail: formatDateTime(order.placedAt), state: 'done' },
          { label: 'Packing and shipping', detail: delivered ? undefined : 'Ships in 1–2 days', state: delivered ? 'done' : 'current' },
          { label: 'Delivered', state: delivered ? 'done' : 'upcoming' },
        ];

  return (
    <ol className="flex flex-col gap-5 sm:flex-row sm:gap-3" aria-label="Order progress">
      {steps.map((step: Step, index: number) => (
        <li key={step.label} aria-current={step.state === 'current' ? 'step' : undefined} className="flex flex-1 items-start gap-3">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${stepStyles[step.state]}`}>
            {step.state === 'done' ? <Check size={16} /> : step.state === 'cancelled' ? <X size={16} /> : index + 1}
          </span>
          <span className="min-w-0">
            <span className={`block text-sm font-semibold ${step.state === 'upcoming' ? 'text-slate-400' : 'text-navy'}`}>{step.label}</span>
            {step.detail && <span className="mt-0.5 block text-xs font-semibold text-slate-400">{step.detail}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

// One order in full. Printing the page gives the invoice: the site's header, footer and buttons are left off paper.
export function OrderDetailsPage({ orders, buyAgain, cancelOrder }: OrderDetailsPageProps) {
  const { id } = useParams();
  const order = orders.find((placed: Order) => placed.id === id);
  usePageTitle(order ? `Order #${order.id}` : 'Page not found');

  if (!order) return <NotFoundPage />;
  const itemCount = order.items.reduce((count: number, item: OrderItem) => count + item.quantity, 0);
  const card = 'rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 print:rounded-none print:border-0 print:p-0 print:shadow-none';

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8 print:max-w-none print:p-0">
      <Link to="/orders" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand print:hidden">
        <ArrowLeft size={17} /> All orders
      </Link>
      <div className="mb-8 hidden border-b border-slate-200 pb-5 print:block">
        <p className="text-2xl font-bold text-navy">YourEcom · Invoice</p>
        <p className="mt-1 text-sm text-slate-500">
          {ADDRESS.join(', ')} · {PHONE}
        </p>
      </div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-leaf print:hidden">Order details</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-navy sm:text-4xl">Order #{order.id}</h1>
            <StatusPill status={order.status} />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-400">Placed on {formatDateTime(order.placedAt)}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-navy transition hover:border-brand hover:text-brand sm:self-auto print:hidden"
        >
          <Printer size={16} /> Print invoice
        </button>
      </div>
      <section className={`mt-8 ${card} print:hidden`}>
        <OrderProgress order={order} />
      </section>
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] print:mt-8 print:block">
        <section className={card}>
          <h2 className="text-lg font-semibold text-navy">Items</h2>
          <OrderItemList items={order.items} />
          <OrderActions order={order} buyAgain={buyAgain} cancelOrder={cancelOrder} className="justify-end border-t border-slate-100 pt-5" />
        </section>
        <div className="space-y-5 print:mt-6 print:grid print:grid-cols-2 print:gap-8 print:space-y-0 print:border-t print:border-slate-200 print:pt-6">
          <section className={card}>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
              <Receipt size={18} className="text-brand print:hidden" /> Price details
            </h2>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between gap-4">
                <dt>Items ({itemCount})</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between gap-4 font-bold text-leaf">
                  <dt>Coupon {order.couponCode}</dt>
                  <dd>−{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt>Delivery</dt>
                <dd>{order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-100 pt-3 text-base font-bold text-navy">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm font-semibold text-slate-500">Payment: {paymentLabels[order.paymentMethod]}</p>
          </section>
          <section className={card}>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
              <MapPin size={18} className="text-leaf print:hidden" /> {deliveryLabels[order.status]}
            </h2>
            <p className="mt-4 font-semibold text-navy">{order.delivery.name}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {order.delivery.address},
              <br />
              {order.delivery.city} – {order.delivery.pincode}
            </p>
            <p className="mt-2 text-sm font-bold text-slate-600">{order.delivery.phone}</p>
          </section>
        </div>
      </div>
      <p className="mt-10 hidden text-center text-sm text-slate-500 print:block">Thank you for shopping with YourEcom.</p>
    </main>
  );
}
