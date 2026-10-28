import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Check, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import { products } from '@/data/products';
import { formatPrice } from '@/lib/pricing';
import { NotFoundPage } from '@/pages/NotFoundPage';
import type { Product } from '@/types/store';

export function ProductPage({ addToCart }: { addToCart: (product: Product, quantity?: number) => void }) {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const product = products.find((item: Product) => item.id === Number(id));

  if (!product) return <NotFoundPage />;

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <Link to="/#products" className="mb-8 inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 transition hover:text-[#0b6fce]">
        <ArrowLeft size={17} /> Back to products
      </Link>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#eaf7ff] p-5">
          <img src={product.image} alt={product.name} className="h-[420px] w-full rounded-[1.5rem] object-cover lg:h-[540px]" />
          {product.badge && <span className="absolute left-10 top-10 rounded-full bg-[#c9f23b] px-4 py-2 text-xs font-black uppercase text-[#082b62]">{product.badge}</span>}
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#159a7a]">{product.category}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-0.04em] text-[#082b62] sm:text-5xl">{product.name}</h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">{product.description}</p>
          <div className="my-7 grid gap-3 sm:grid-cols-3">
            {product.features.map((feature: string) => (
              <div key={feature} className="rounded-2xl border border-slate-100 bg-white p-3 text-sm font-bold text-[#082b62] shadow-sm">
                <Check size={17} className="mb-2 text-[#159a7a]" />
                {feature}
              </div>
            ))}
          </div>
          <div className="flex items-end justify-between border-y border-slate-100 py-6">
            <div>
              <p className="text-3xl font-black text-[#082b62]">{formatPrice(product.price)}</p>
              <p className="text-sm font-semibold text-slate-400">{product.unit} · Inclusive of taxes</p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-slate-200 p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity === 1}
                aria-label="Decrease quantity"
                className="rounded-full bg-slate-100 p-2 transition hover:bg-slate-200 disabled:opacity-40"
              >
                <Minus size={15} />
              </button>
              <span className="w-6 text-center font-black">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity" className="rounded-full bg-slate-100 p-2 transition hover:bg-slate-200">
                <Plus size={15} />
              </button>
            </div>
          </div>
          <button
            onClick={() => addToCart(product, quantity)}
            className="mt-6 flex items-center justify-center gap-3 rounded-full bg-[#0b6fce] py-4 font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-[#082b62]"
          >
            <ShoppingCart size={19} /> Add {quantity} to cart
          </button>
          <div className="mt-5 flex flex-wrap gap-5 text-sm font-bold text-slate-500">
            <span className="flex items-center gap-2">
              <Truck size={17} className="text-[#0b6fce]" /> Ships in 1–2 days
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-[#159a7a]" /> Quality guaranteed
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
