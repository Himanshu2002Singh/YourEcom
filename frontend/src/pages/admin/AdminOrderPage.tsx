import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router';
import { CircleAlert, Copy, Mail, Phone, Printer } from 'lucide-react';
import { BackLink, PageHeader, adminCard, adminMain, secondaryButton } from '@/components/AdminLayout';
import { OrderItemList, StatusPill } from '@/components/OrderParts';
import { LoadError, Loading, WhatsAppIcon } from '@/components/StoreShared';
import { TextField } from '@/components/TextField';
import { useApiData } from '@/hooks/useApiData';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api, type ApiError } from '@/lib/api';
import { formatDateTime, paymentLabels } from '@/lib/format';
import { formatPrice } from '@/lib/pricing';
import type { AdminOrder, OrderItem } from '@/types/store';

type Notify = (message: string, options?: { error?: boolean }) => void;
type NextStatus = 'Shipped' | 'Delivered' | 'Cancelled';

// The customer's 10-digit mobile number, however it was typed at checkout (+91 98765 43210, 098765-43210…).
const mobileDigits = (phone: string): string => phone.replace(/\D/g, '').slice(-10);

const card = `${adminCard} p-4 sm:p-5`;

// Ship (with the courier and tracking number the customer will see), mark delivered, or cancel. Delivered and
// cancelled orders are final, so those two ask first.
function StatusActions({ order, saved, notify }: { order: AdminOrder; saved: (order: AdminOrder, status: NextStatus) => void; notify: Notify }) {
  const [tracking, setTracking] = useState(order.tracking ?? '');
  const [confirming, setConfirming] = useState<'Delivered' | 'Cancelled' | null>(null);
  const [busy, setBusy] = useState(false);

  if (order.status === 'Delivered' || order.status === 'Cancelled') {
    return <p className="text-sm text-slate-500">This order is {order.status.toLowerCase()}. Nothing more to do.</p>;
  }

  const move = async (status: NextStatus): Promise<void> => {
    setBusy(true);
    try {
      const { order: changed } = await api<{ order: AdminOrder }>(`/admin/orders/${order.id}/status`, { method: 'PUT', body: { status, tracking } });
      saved(changed, status);
    } catch (error) {
      notify((error as ApiError).message, { error: true });
    }
    setBusy(false);
    setConfirming(null);
  };

  const ship = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void move('Shipped');
  };

  const shipped = order.status === 'Shipped';
  const button = 'rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60';

  return (
    <form onSubmit={ship} className="space-y-4">
      <TextField
        name="tracking"
        label="Courier and tracking number"
        placeholder="e.g. DTDC D12345678"
        value={tracking}
        maxLength={200}
        onChange={(event) => setTracking(event.target.value)}
        hint="The customer sees this on their order."
      />
      {confirming ? (
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-sm font-semibold text-navy">
            {confirming === 'Cancelled' ? `Cancel order #${order.id}? Its items go back in stock.` : `Mark order #${order.id} as delivered? This can’t be undone.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void move(confirming)}
              className={`${button} text-white ${confirming === 'Cancelled' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-leaf hover:bg-emerald-800'}`}
            >
              {busy ? 'Saving…' : confirming === 'Cancelled' ? 'Yes, cancel order' : 'Yes, it’s delivered'}
            </button>
            <button type="button" disabled={busy} onClick={() => setConfirming(null)} className={`${button} border border-slate-200 bg-white text-slate-600 hover:text-navy`}>
              Go back
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy || (shipped && tracking.trim() === (order.tracking ?? ''))} className={`${button} bg-brand text-white hover:bg-navy`}>
            {busy ? 'Saving…' : shipped ? 'Update tracking' : 'Mark as shipped'}
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirming('Delivered')} className={`${button} border border-slate-200 bg-white text-leaf hover:border-leaf`}>
            Mark as delivered
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirming('Cancelled')} className={`${button} border border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-600`}>
            Cancel order
          </button>
        </div>
      )}
    </form>
  );
}

// One order in full for the admin: what to pack, who it goes to (call, WhatsApp, copy the address for the courier),
// how it's paid, and the buttons that move it on. Printing gives a packing slip.
export function AdminOrderPage({ notify, stockChanged }: { notify: Notify; stockChanged: () => void }) {
  const { id = '' } = useParams();
  usePageTitle(`Order #${id} · Admin`);
  const { data, error, reload, setData } = useApiData<{ order: AdminOrder }>(`/admin/orders/${encodeURIComponent(id)}`);

  const back = <BackLink to="/admin/orders">All orders</BackLink>;
  if (error) {
    return (
      <main className={adminMain}>
        {back}
        <div className="mt-6">
          <LoadError message={error} retry={reload} />
        </div>
      </main>
    );
  }
  if (!data) return <main className={adminMain}><Loading /></main>;

  const { order } = data;
  const { delivery } = order;
  const pieces = order.items.reduce((count: number, item: OrderItem) => count + item.quantity, 0);
  const mobile = mobileDigits(delivery.phone);

  const saved = (changed: AdminOrder, status: NextStatus): void => {
    setData({ order: changed });
    if (status === 'Cancelled') stockChanged();
    notify(
      status === 'Cancelled'
        ? `Order #${changed.id} cancelled. Its items are back in stock`
        : status === 'Delivered'
          ? `Order #${changed.id} marked as delivered`
          : order.status === 'Shipped'
            ? 'Tracking updated'
            : `Order #${changed.id} marked as shipped`,
    );
  };

  const copyAddress = (): void => {
    const text = [delivery.name, delivery.address, `${delivery.city} – ${delivery.pincode}`, delivery.phone].join('\n');
    navigator.clipboard.writeText(text).then(
      () => notify('Address copied'),
      () => notify('Couldn’t copy. Select the address and copy it instead.', { error: true }),
    );
  };

  return (
    <main className={adminMain}>
      <p className="mb-6 hidden text-2xl font-bold text-navy print:block">YourEcom · Packing slip</p>
      <PageHeader
        back={back}
        title={
          <span className="flex flex-wrap items-center gap-3">
            Order #{order.id} <StatusPill status={order.status} />
          </span>
        }
        description={`Placed ${formatDateTime(order.placedAt)} · ${pieces} ${pieces === 1 ? 'item' : 'items'}${order.tracking ? ` · ${order.tracking}` : ''}`}
        actions={
          <button onClick={() => window.print()} className={secondaryButton}>
            <Printer size={16} /> Print packing slip
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] print:block">
        <div className="space-y-5">
          <section className={`${card} print:hidden`}>
            <h2 className="mb-4 text-lg font-semibold text-navy">Update the order</h2>
            <StatusActions key={`${order.status}-${order.tracking}`} order={order} saved={saved} notify={notify} />
          </section>
          <section className={card}>
            <h2 className="text-lg font-semibold text-navy">Items to pack</h2>
            <OrderItemList items={order.items} />
            <dl className="space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <div className="flex justify-between gap-4">
                <dt>Items ({pieces})</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between gap-4 text-leaf">
                  <dt>Coupon {order.couponCode}</dt>
                  <dd>−{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt>Delivery</dt>
                <dd>{order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-100 pt-2 text-base font-bold text-navy">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="space-y-5 print:mt-6">
          <section className={card}>
            <h2 className="text-lg font-semibold text-navy">Deliver to</h2>
            <p className="mt-3 font-semibold text-navy">{delivery.name}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {delivery.address}
              <br />
              {delivery.city} – {delivery.pincode}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{delivery.phone}</p>
            <div className="mt-4 flex flex-wrap gap-2 print:hidden">
              <a href={`tel:+91${mobile}`} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-navy transition hover:border-brand hover:text-brand">
                <Phone size={15} /> Call
              </a>
              <a
                href={`https://wa.me/91${mobile}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-navy transition hover:border-whatsapp hover:text-whatsapp"
              >
                <WhatsAppIcon size={15} /> WhatsApp
              </a>
              <button onClick={copyAddress} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-navy transition hover:border-brand hover:text-brand">
                <Copy size={15} /> Copy address
              </button>
            </div>
          </section>
          <section className={`${card} print:hidden`}>
            <h2 className="text-lg font-semibold text-navy">Customer account</h2>
            <p className="mt-3 font-semibold text-navy">{order.customerName}</p>
            <a href={`mailto:${order.email}`} className="mt-1 flex items-center gap-1.5 break-all text-sm text-brand hover:underline">
              <Mail size={14} className="shrink-0" /> {order.email}
            </a>
          </section>
          <section className={card}>
            <h2 className="text-lg font-semibold text-navy">Payment</h2>
            <p className="mt-3 text-sm font-semibold text-slate-700">{paymentLabels[order.paymentMethod]}</p>
            {order.paymentMethod === 'cod' ? (
              <p className="mt-1 text-sm text-slate-500">Collect {formatPrice(order.total)} in cash at delivery.</p>
            ) : (
              <p className="mt-2 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 print:hidden">
                <CircleAlert size={17} className="mt-0.5 shrink-0" />
                Online payments aren’t connected yet, so nothing was charged. Collect {formatPrice(order.total)} before you ship.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
