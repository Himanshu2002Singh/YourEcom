import { useState } from 'react';
import { formatPrice } from '@/lib/pricing';
import type { Order, OrderItem, OrderStatus } from '@/types/store';

// Pieces shared by the orders list and the order details page.

const statusStyles: Record<OrderStatus, string> = {
  Processing: 'bg-sky-50 text-[#0b6fce]',
  Delivered: 'bg-emerald-50 text-[#159a7a]',
  Cancelled: 'bg-slate-100 text-slate-500',
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${statusStyles[status]}`}>{status}</span>;
}

// The products as they were when the order was placed.
export function OrderItemList({ items }: { items: OrderItem[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item: OrderItem) => (
        <li key={item.id} className="flex items-center gap-4 py-4 print:break-inside-avoid">
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
  );
}

type OrderActionsProps = { order: Order; buyAgain: (order: Order) => void; cancelOrder: (id: string) => Promise<void>; className?: string };

// Cancel (only while Processing, and only after confirming) and Buy again.
export function OrderActions({ order, buyAgain, cancelOrder, className = '' }: OrderActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const confirmCancel = async (): Promise<void> => {
    setCancelling(true);
    await cancelOrder(order.id);
    setCancelling(false);
    setConfirming(false);
  };

  return (
    <div className={`flex flex-wrap gap-2 print:hidden ${className}`}>
      {order.status === 'Processing' &&
        (confirming ? (
          <>
            <button
              onClick={() => void confirmCancel()}
              disabled={cancelling}
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-60"
            >
              {cancelling ? 'Cancelling…' : 'Yes, cancel order'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={cancelling}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-500 transition hover:text-[#082b62]"
            >
              Keep it
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
          >
            Cancel order
          </button>
        ))}
      <button onClick={() => buyAgain(order)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-extrabold text-[#0b6fce] transition hover:bg-sky-50">
        Buy again
      </button>
    </div>
  );
}
