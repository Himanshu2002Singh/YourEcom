import { useEffect, useRef, type MouseEvent } from 'react';
import { ShoppingCart, Trash2, X } from 'lucide-react';
import { QuantityStepper } from '@/components/QuantityStepper';
import { FREE_DELIVERY_THRESHOLD, deliveryFeeFor, formatPrice } from '@/lib/pricing';
import type { CartItem } from '@/types/store';

type CartDrawerProps = {
  open: boolean;
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  setOpen: (open: boolean) => void;
  setQuantity: (id: number, quantity: number) => void;
  checkout: () => void;
};

export function CartDrawer({ open, cart, cartCount, cartTotal, setOpen, setQuantity, checkout }: CartDrawerProps) {
  const panel = useRef<HTMLElement>(null);

  // While open: Escape closes, Tab stays inside the drawer, the page behind stops scrolling without
  // shifting sideways when its scrollbar disappears, and focus goes back to the opener on close.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab' || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), input, a[href]');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      opener?.focus();
    };
  }, [open, setOpen]);

  if (!open) return null;
  const deliveryFee = deliveryFeeFor(cartTotal);
  const remainingForFreeDelivery = FREE_DELIVERY_THRESHOLD - cartTotal;

  return (
    <div className="fixed inset-0 z-40 bg-[#082b62]/30 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id="cart-title" className="text-xl font-black text-[#082b62]">
              Your cart
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button autoFocus onClick={() => setOpen(false)} aria-label="Close cart" className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200">
            <X size={19} />
          </button>
        </div>
        {/* On short screens (phones in landscape) the whole panel scrolls, so items are not squeezed out by the summary. */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 [@media(max-height:500px)]:flex-none [@media(max-height:500px)]:overflow-visible">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-full bg-sky-50 p-5 text-[#0b6fce]">
                <ShoppingCart size={30} />
              </div>
              <h3 className="mt-5 font-extrabold text-[#082b62]">Your cart is empty</h3>
              <p className="mt-2 text-sm text-slate-400">Add supplies you need and they will appear here.</p>
              <button onClick={() => setOpen(false)} className="mt-6 rounded-full bg-[#eaf7ff] px-5 py-2.5 text-sm font-extrabold text-[#0b6fce] transition hover:bg-[#0b6fce] hover:text-white">
                Continue shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item: CartItem) => (
                <div key={item.id} className="flex gap-3 rounded-2xl border border-slate-100 p-3">
                  <img src={item.image} alt={item.name} className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-extrabold leading-snug text-[#082b62]">{item.name}</p>
                      <button
                        onClick={() => setQuantity(item.id, 0)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-[#e25d54]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-slate-400">
                      {formatPrice(item.price)} · {item.unit}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <QuantityStepper quantity={item.quantity} onChange={(next: number) => setQuantity(item.id, next)} label={item.name} max={item.stock} size="sm" tone="light" />
                      <span className="ml-auto font-black text-[#082b62]">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-slate-100 p-6">
            <p className="mb-4 rounded-2xl bg-sky-50 px-4 py-3 text-center text-sm font-bold text-[#0b6fce]">
              {remainingForFreeDelivery > 0 ? `Add ${formatPrice(remainingForFreeDelivery)} more for free delivery` : 'You have unlocked free delivery'}
            </p>
            <div className="space-y-2 text-sm text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                {deliveryFee === 0 ? <span className="font-bold text-[#159a7a]">FREE</span> : <span>{formatPrice(deliveryFee)}</span>}
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-black text-[#082b62]">
                <span>Total</span>
                <span>{formatPrice(cartTotal + deliveryFee)}</span>
              </div>
            </div>
            <button onClick={checkout} className="mt-5 w-full rounded-full bg-[#0b6fce] py-4 font-extrabold text-white transition hover:bg-[#082b62]">
              Continue to checkout
            </button>
            <p className="mt-3 text-center text-xs font-semibold text-slate-400">Have a coupon? Apply it at checkout.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
