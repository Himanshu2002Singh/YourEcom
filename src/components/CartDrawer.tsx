import type { MouseEvent } from 'react';
import { Minus, Plus, ShoppingCart, X } from 'lucide-react';
import type { CartItem } from '@/types/store';

type CartDrawerProps = {
  open: boolean;
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  setOpen: (open: boolean) => void;
  updateQuantity: (id: number, change: number) => void;
  checkout: () => void;
};

export function CartDrawer({ open, cart, cartCount, cartTotal, setOpen, updateQuantity, checkout }: CartDrawerProps) {
  if (!open) return null;
  return <div className="fixed inset-0 z-40 bg-[#082b62]/30 backdrop-blur-sm" onClick={() => setOpen(false)}><aside onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()} className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="text-xl font-black text-[#082b62]">Your cart</h2><p className="mt-1 text-sm text-slate-400">{cartCount} items selected</p></div><button onClick={() => setOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-500"><X size={19} /></button></div><div className="flex-1 overflow-y-auto p-6">{cart.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-center"><div className="rounded-full bg-sky-50 p-5 text-[#0b6fce]"><ShoppingCart size={30} /></div><h3 className="mt-5 font-extrabold text-[#082b62]">Your cart is empty</h3><p className="mt-2 text-sm text-slate-400">Add supplies you need and they will appear here.</p></div> : <div className="space-y-4">{cart.map((item: CartItem) => <div key={item.id} className="flex gap-3 rounded-2xl border border-slate-100 p-3"><img src={item.image} alt={item.name} className="h-20 w-20 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-extrabold text-[#082b62]">{item.name}</p><p className="mt-1 text-sm font-bold text-[#0b6fce]">₹{item.price.toLocaleString('en-IN')}</p><div className="mt-2 flex items-center gap-3"><button onClick={() => updateQuantity(item.id, -1)} className="rounded-full bg-slate-100 p-1"><Minus size={13} /></button><span className="text-sm font-bold">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="rounded-full bg-slate-100 p-1"><Plus size={13} /></button></div></div></div>)}</div>}</div>{cart.length > 0 && <div className="border-t border-slate-100 p-6"><div className="mb-4 flex justify-between font-black text-[#082b62]"><span>Estimated total</span><span>₹{cartTotal.toLocaleString('en-IN')}</span></div><button onClick={checkout} className="w-full rounded-full bg-[#0b6fce] py-4 font-extrabold text-white transition hover:bg-[#082b62]">Continue to checkout</button></div>}</aside></div>;
}
