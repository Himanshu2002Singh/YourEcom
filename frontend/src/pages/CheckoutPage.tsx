import { Fragment, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Check, CreditCard, LockKeyhole, MapPin, Minus, PackageCheck, Plus, ShoppingCart, type LucideIcon } from 'lucide-react';
import { FREE_DELIVERY_THRESHOLD, deliveryFeeFor, formatPrice } from '@/lib/pricing';
import type { CartItem, DeliveryDetails, Order, PaymentMethod, User } from '@/types/store';

type CheckoutPageProps = {
  cart: CartItem[];
  cartTotal: number;
  user: User;
  savedDelivery?: DeliveryDetails;
  updateQuantity: (id: number, change: number) => void;
  placeOrder: (delivery: DeliveryDetails, paymentMethod: PaymentMethod) => Order;
};

type DeliveryField = {
  field: keyof DeliveryDetails;
  label: string;
  placeholder: string;
  autoComplete: string;
  inputMode?: 'tel' | 'numeric';
  pattern?: string;
  title?: string;
  wide?: boolean;
};

const deliveryFields: DeliveryField[] = [
  { field: 'name', label: 'Full name', placeholder: 'Aarav Singh', autoComplete: 'name' },
  {
    field: 'phone',
    label: 'Phone number',
    placeholder: '98765 43210',
    autoComplete: 'tel',
    inputMode: 'tel',
    pattern: '(\\+91 ?)?[6-9]\\d{4} ?\\d{5}',
    title: 'Enter a 10-digit mobile number, e.g. 98765 43210',
  },
  { field: 'address', label: 'Full address', placeholder: 'House / street / landmark', autoComplete: 'street-address', wide: true },
  { field: 'city', label: 'City', placeholder: 'New Delhi', autoComplete: 'address-level2' },
  { field: 'pincode', label: 'Pincode', placeholder: '110059', autoComplete: 'postal-code', inputMode: 'numeric', pattern: '[1-9]\\d{5}', title: 'Enter a 6-digit pincode' },
];

const paymentOptions: { value: PaymentMethod; title: string; description: string; icon: LucideIcon }[] = [
  { value: 'online', title: 'Card / UPI', description: 'Secure online payment', icon: CreditCard },
  { value: 'cod', title: 'Cash on delivery', description: 'Pay in cash when your order arrives', icon: PackageCheck },
];

const steps = ['Delivery', 'Payment', 'Done'];

export function CheckoutPage({ cart, cartTotal, user, savedDelivery, updateQuantity, placeOrder }: CheckoutPageProps) {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [form, setForm] = useState<DeliveryDetails>(savedDelivery ?? { name: user.name, phone: '', address: '', city: '', pincode: '' });

  if (placedOrder) return <OrderConfirmation order={placedOrder} />;
  if (cart.length === 0) return <EmptyCheckout />;

  const total = cartTotal + deliveryFeeFor(cartTotal);
  const update = (field: keyof DeliveryDetails, value: string): void => setForm((current: DeliveryDetails) => ({ ...current, [field]: value }));

  const continueToPayment = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setForm((current: DeliveryDetails) => ({
      name: current.name.trim(),
      phone: current.phone.trim(),
      address: current.address.trim(),
      city: current.city.trim(),
      pincode: current.pincode.trim(),
    }));
    setStep(2);
  };

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <Link to="/#products" className="mb-8 inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 hover:text-[#0b6fce]">
        <ArrowLeft size={17} /> Continue shopping
      </Link>
      <div className="mb-10 flex items-center justify-center gap-2 text-xs font-extrabold sm:gap-4 sm:text-sm">
        {steps.map((label: string, index: number) => {
          const active = step > index;
          return (
            <Fragment key={label}>
              {index > 0 && <span className="h-px w-5 bg-slate-200 sm:w-24" />}
              <span aria-current={step === index + 1 ? 'step' : undefined} className={`flex items-center gap-2 ${active ? 'text-[#0b6fce]' : 'text-slate-400'}`}>
                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${active ? 'bg-[#0b6fce] text-white' : 'bg-slate-200 text-slate-500'}`}>{index + 1}</span>
                {label}
              </span>
            </Fragment>
          );
        })}
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          {step === 1 ? (
            <form onSubmit={continueToPayment}>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#159a7a]">Delivery details</p>
              <h1 className="mt-2 text-3xl font-black text-[#082b62]">Where should we deliver?</h1>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {deliveryFields.map(({ field, label, wide, ...input }: DeliveryField) => (
                  <label key={field} className={wide ? 'sm:col-span-2' : ''}>
                    <span className="mb-2 block text-sm font-extrabold text-[#082b62]">{label}</span>
                    <input
                      required
                      {...input}
                      value={form[field]}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => update(field, event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-[#0b6fce] focus:bg-white [&:user-invalid]:border-rose-400"
                    />
                  </label>
                ))}
              </div>
              <button type="submit" className="mt-7 w-full rounded-full bg-[#0b6fce] py-4 font-extrabold text-white transition hover:bg-[#082b62]">
                Continue to payment <ArrowRight className="ml-2 inline" size={17} />
              </button>
            </form>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0b6fce]">
                <ArrowLeft size={16} /> Edit delivery
              </button>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#159a7a]">Payment method</p>
              <h1 className="mt-2 text-3xl font-black text-[#082b62]">Choose how to pay</h1>
              <div className="mt-6 flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                <MapPin size={18} className="mt-0.5 shrink-0 text-[#159a7a]" />
                <p className="leading-6 text-slate-600">
                  <strong className="text-[#082b62]">{form.name}</strong> · {form.phone}
                  <br />
                  {form.address}, {form.city} – {form.pincode}
                </p>
              </div>
              <fieldset className="mt-6 grid gap-3">
                <legend className="sr-only">Payment method</legend>
                {paymentOptions.map(({ value, title, description, icon: Icon }) => {
                  const selected = paymentMethod === value;
                  return (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 p-4 text-left transition ${selected ? 'border-[#0b6fce] bg-sky-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`rounded-xl p-2 ${selected ? 'bg-white text-[#0b6fce]' : 'bg-slate-100 text-slate-500'}`}>
                          <Icon size={20} />
                        </span>
                        <span>
                          <strong className="block text-[#082b62]">{title}</strong>
                          <small className="text-slate-500">{description}</small>
                        </span>
                      </span>
                      <input type="radio" name="payment-method" value={value} checked={selected} onChange={() => setPaymentMethod(value)} className="h-5 w-5 accent-[#0b6fce]" />
                    </label>
                  );
                })}
              </fieldset>
              <button onClick={() => setPlacedOrder(placeOrder(form, paymentMethod))} className="mt-7 w-full rounded-full bg-[#0b6fce] py-4 font-extrabold text-white transition hover:bg-[#082b62]">
                Place order · {formatPrice(total)}
              </button>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                <LockKeyhole size={14} /> Your payment information is protected
              </p>
            </>
          )}
        </section>
        <OrderSummary cart={cart} cartTotal={cartTotal} updateQuantity={updateQuantity} />
      </div>
    </main>
  );
}

function OrderSummary({ cart, cartTotal, updateQuantity }: { cart: CartItem[]; cartTotal: number; updateQuantity: (id: number, change: number) => void }) {
  const deliveryFee = deliveryFeeFor(cartTotal);
  return (
    <aside className="h-fit rounded-[2rem] bg-[#082b62] p-6 text-white shadow-xl sm:p-8">
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#c9f23b]">Order summary</p>
      <h2 className="mt-2 text-2xl font-black">Your essentials</h2>
      <div className="mt-6 space-y-4">
        {cart.map((item: CartItem) => (
          <div key={item.id} className="flex gap-3 border-b border-white/10 pb-4">
            <img src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">{item.name}</p>
              <p className="mt-1 text-xs text-blue-200">
                {formatPrice(item.price)} · {item.unit}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => updateQuantity(item.id, -1)} aria-label={`Decrease ${item.name} quantity`} className="rounded-full bg-white/10 p-1 transition hover:bg-white/20">
                  <Minus size={12} />
                </button>
                <span className="text-xs font-bold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} aria-label={`Increase ${item.name} quantity`} className="rounded-full bg-white/10 p-1 transition hover:bg-white/20">
                  <Plus size={12} />
                </button>
              </div>
            </div>
            <p className="text-sm font-black">{formatPrice(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3 text-sm text-blue-100">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(cartTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          {deliveryFee === 0 ? <span className="font-bold text-[#c9f23b]">FREE</span> : <span>{formatPrice(deliveryFee)}</span>}
        </div>
        {deliveryFee > 0 && <p className="text-xs text-blue-200">Add {formatPrice(FREE_DELIVERY_THRESHOLD - cartTotal)} more for free delivery.</p>}
        <div className="mt-4 flex justify-between border-t border-white/15 pt-4 text-lg font-black text-white">
          <span>Total</span>
          <span>{formatPrice(cartTotal + deliveryFee)}</span>
        </div>
      </div>
    </aside>
  );
}

function OrderConfirmation({ order }: { order: Order }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-5 py-16">
      <div className="w-full rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-blue-100 sm:p-14">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-[#159a7a]">
          <Check size={40} />
        </div>
        <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.18em] text-[#159a7a]">Order confirmed</p>
        <h1 className="mt-3 text-4xl font-black text-[#082b62]">Your care package is on its way.</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-500">
          Order #{order.id} for {formatPrice(order.total)} has been received{order.paymentMethod === 'cod' ? ' — please keep the cash ready at delivery' : ''}. We will send dispatch
          updates to {order.delivery.phone}.
        </p>
        <Link to="/orders" className="mt-8 inline-block rounded-full bg-[#0b6fce] px-7 py-4 font-extrabold text-white transition hover:bg-[#082b62]">
          View my orders
        </Link>
      </div>
    </main>
  );
}

function EmptyCheckout() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center">
      <div className="rounded-full bg-sky-50 p-5 text-[#0b6fce]">
        <ShoppingCart size={30} />
      </div>
      <h1 className="mt-5 text-3xl font-black text-[#082b62]">Your cart is empty</h1>
      <p className="mt-2 text-slate-500">Add the supplies you need, then come back to check out.</p>
      <Link to="/#products" className="mt-7 rounded-full bg-[#0b6fce] px-7 py-4 font-extrabold text-white transition hover:bg-[#082b62]">
        Browse products
      </Link>
    </main>
  );
}
