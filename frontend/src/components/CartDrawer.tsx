import { useEffect, type MouseEvent } from 'react';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { FREE_DELIVERY_THRESHOLD, formatPrice } from '@/lib/pricing';
import type { CartItem } from '@/types/store';

type CartDrawerProps = {
  open: boolean;
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  setOpen: (open: boolean) => void;
  updateQuantity: (id: number, change: number) => void;
  removeFromCart: (id: number) => void;
  checkout: () => void;
};

export function CartDrawer({ open, cart, cartCount, cartTotal, setOpen, updateQuantity, removeFromCart, checkout }: CartDrawerProps) {
  // While open: Escape closes the drawer and the page behind it stops scrolling.
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [open, setOpen]);

  if (!open) return null;
  const remainingForFreeDelivery = FREE_DELIVERY_THRESHOLD - cartTotal;

  return (
    <div className="fixed inset-0 z-40 bg-[#082b62]/30 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id="cart-title" className="text-xl font-black text-[#082b62]">
              Your cart
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {cartCount} {cartCount === 1 ? 'item' : 'items'} selected
            </p>
          </div>
          <button autoFocus onClick={() => setOpen(false)} aria-label="Close cart" className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200">
            <X size={19} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
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
                  <img src={item.image} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-extrabold text-[#082b62]">{item.name}</p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-rose-50 hover:text-[#e25d54]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <p className="mt-1 text-sm font-bold text-[#0b6fce]">
                      {formatPrice(item.price)} <span className="font-semibold text-slate-400">· {item.unit}</span>
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <button onClick={() => updateQuantity(item.id, -1)} aria-label={`Decrease ${item.name} quantity`} className="rounded-full bg-slate-100 p-1 transition hover:bg-slate-200">
                        <Minus size={13} />
                      </button>
                      <span className="text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} aria-label={`Increase ${item.name} quantity`} className="rounded-full bg-slate-100 p-1 transition hover:bg-slate-200">
                        <Plus size={13} />
                      </button>
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
            <div className="mb-4 flex justify-between font-black text-[#082b62]">
              <span>Subtotal</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <button onClick={checkout} className="w-full rounded-full bg-[#0b6fce] py-4 font-extrabold text-white transition hover:bg-[#082b62]">
              Continue to checkout
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
