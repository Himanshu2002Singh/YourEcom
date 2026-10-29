import { Fragment, useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Check, CreditCard, LockKeyhole, MapPin, PackageCheck, ShoppingCart, type LucideIcon } from 'lucide-react';
import { QuantityStepper } from '@/components/QuantityStepper';
import { TextField } from '@/components/TextField';
import { usePageTitle } from '@/hooks/usePageTitle';
import { FREE_DELIVERY_THRESHOLD, deliveryFeeFor, formatPrice } from '@/lib/pricing';
import type { CartItem, DeliveryDetails, Order, PaymentMethod, User } from '@/types/store';

type CheckoutPageProps = {
  cart: CartItem[];
  cartTotal: number;
  user: User;
  savedDelivery?: DeliveryDetails;
  setQuantity: (id: number, quantity: number) => void;
  placeOrder: (delivery: DeliveryDetails, paymentMethod: PaymentMethod) => Promise<Order>;
};

type Field = keyof DeliveryDetails;

// Each validator receives the trimmed value and returns an error message, or undefined when valid.
const deliveryFields: {
  field: Field;
  label: string;
  placeholder: string;
  autoComplete: string;
  inputMode?: 'tel' | 'numeric';
  hint?: string;
  wide?: boolean;
  validate: (value: string) => string | undefined;
}[] = [
  { field: 'name', label: 'Full name', placeholder: 'Aarav Singh', autoComplete: 'name', validate: (value) => (value ? undefined : 'Enter the name of the person receiving the order') },
  {
    field: 'phone',
    label: 'Phone number',
    placeholder: '98765 43210',
    autoComplete: 'tel',
    inputMode: 'tel',
    hint: '10-digit mobile number for delivery updates',
    validate: (value) => (/^(\+91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/.test(value) ? undefined : 'Enter a valid 10-digit mobile number'),
  },
  {
    field: 'address',
    label: 'Full address',
    placeholder: 'House / street / landmark',
    autoComplete: 'street-address',
    wide: true,
    validate: (value) => (value.length >= 5 ? undefined : 'Enter the full delivery address'),
  },
  { field: 'city', label: 'City', placeholder: 'New Delhi', autoComplete: 'address-level2', validate: (value) => (value ? undefined : 'Enter the city') },
  {
    field: 'pincode',
    label: 'Pincode',
    placeholder: '110059',
    autoComplete: 'postal-code',
    inputMode: 'numeric',
    validate: (value) => (/^[1-9]\d{5}$/.test(value) ? undefined : 'Enter a valid 6-digit pincode'),
  },
];

const paymentOptions: { value: PaymentMethod; title: string; description: string; icon: LucideIcon }[] = [
  { value: 'online', title: 'Card / UPI', description: 'Secure online payment', icon: CreditCard },
  { value: 'cod', title: 'Cash on delivery', description: 'Pay in cash when your order arrives', icon: PackageCheck },
];

const steps = ['Delivery', 'Payment', 'Done'];

const errorFor = (field: Field, value: string): string | undefined => deliveryFields.find((item) => item.field === field)?.validate(value.trim());

export function CheckoutPage({ cart, cartTotal, user, savedDelivery, setQuantity, placeOrder }: CheckoutPageProps) {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [form, setForm] = useState<DeliveryDetails>(savedDelivery ?? { name: user.name, phone: '', address: '', city: '', pincode: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  usePageTitle(placedOrder ? 'Order confirmed' : 'Checkout');

  if (placedOrder) return <OrderConfirmation order={placedOrder} />;
  // While an order is being placed the cart empties just before the confirmation arrives.
  if (cart.length === 0 && !placing) return <EmptyCheckout />;

  const total = cartTotal + deliveryFeeFor(cartTotal);

  const update = (event: ChangeEvent<HTMLInputElement>): void => {
    const field = event.target.name as Field;
    const value = event.target.value;
    setForm((current: DeliveryDetails) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: errorFor(field, value) }));
  };

  // Check a field when the user leaves it, without flagging fields they haven't filled in yet.
  const checkField = (event: FocusEvent<HTMLInputElement>): void => {
    const field = event.target.name as Field;
    const value = event.target.value;
    if (value.trim()) setErrors((current) => ({ ...current, [field]: errorFor(field, value) }));
  };

  const continueToPayment = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmed: DeliveryDetails = { name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim(), city: form.city.trim(), pincode: form.pincode.trim() };
    const nextErrors: Partial<Record<Field, string>> = {};
    deliveryFields.forEach(({ field, validate }) => {
      nextErrors[field] = validate(trimmed[field]);
    });
    setErrors(nextErrors);
    const firstInvalid = deliveryFields.find(({ field }) => nextErrors[field]);
    if (firstInvalid) {
      document.getElementById(firstInvalid.field)?.focus();
      return;
    }
    setForm(trimmed);
    setStep(2);
  };

  // The backend prices the order and answers with it, or with a message to show if it refuses.
  const submitOrder = async (): Promise<void> => {
    setPlacing(true);
    setOrderError('');
    try {
      setPlacedOrder(await placeOrder(form, paymentMethod));
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Something went wrong. Try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <Link to="/#products" className="mb-8 inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 hover:text-[#0b6fce]">
        <ArrowLeft size={17} /> Continue shopping
      </Link>
      <CheckoutSteps step={step} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
          {step === 1 ? (
            <form noValidate onSubmit={continueToPayment}>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#159a7a]">Delivery details</p>
              <h1 className="mt-2 text-3xl font-black text-[#082b62]">Where should we deliver?</h1>
              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {deliveryFields.map(({ field, label, placeholder, autoComplete, inputMode, hint, wide }) => (
                  <TextField
                    key={field}
                    name={field}
                    label={label}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    inputMode={inputMode}
                    hint={hint}
                    wide={wide}
                    error={errors[field]}
                    value={form[field]}
                    onChange={update}
                    onBlur={checkField}
                  />
                ))}
              </div>
              <button type="submit" className="mt-7 w-full rounded-full bg-[#0b6fce] py-4 font-extrabold text-white transition hover:bg-[#082b62]">
                Continue to payment <ArrowRight className="ml-2 inline" size={17} />
              </button>
            </form>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="-mt-1 mb-5 flex items-center gap-2 py-1 text-sm font-bold text-slate-500 hover:text-[#0b6fce]">
                <ArrowLeft size={16} /> Edit delivery details
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
              <button
                onClick={submitOrder}
                disabled={placing}
                className="mt-7 w-full rounded-full bg-[#0b6fce] py-4 font-extrabold text-white transition hover:bg-[#082b62] disabled:cursor-wait disabled:opacity-60"
              >
                {placing ? 'Placing your order…' : `Place order · ${formatPrice(total)}`}
              </button>
              {orderError && (
                <p role="alert" className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                  {orderError}
                </p>
              )}
              <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                <LockKeyhole size={14} /> Your payment information is protected
              </p>
            </>
          )}
        </section>
        <OrderSummary cart={cart} cartTotal={cartTotal} setQuantity={setQuantity} />
      </div>
    </main>
  );
}

function CheckoutSteps({ step }: { step: number }) {
  return (
    <div className="mb-10 flex items-center justify-center gap-2 text-xs font-extrabold sm:gap-4 sm:text-sm">
      {steps.map((label: string, index: number) => {
        const reached = step > index;
        const done = step > index + 1 || step === steps.length;
        return (
          <Fragment key={label}>
            {index > 0 && <span className={`h-px w-5 sm:w-24 ${reached ? 'bg-[#0b6fce]' : 'bg-slate-200'}`} />}
            <span aria-current={step === index + 1 ? 'step' : undefined} className={`flex items-center gap-2 ${reached ? 'text-[#0b6fce]' : 'text-slate-400'}`}>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${reached ? 'bg-[#0b6fce] text-white' : 'bg-slate-200 text-slate-500'}`}>
                {done ? <Check size={15} /> : index + 1}
              </span>
              <span className="max-[359px]:sr-only">{label}</span>
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}

function OrderSummary({ cart, cartTotal, setQuantity }: { cart: CartItem[]; cartTotal: number; setQuantity: (id: number, quantity: number) => void }) {
  const deliveryFee = deliveryFeeFor(cartTotal);
  return (
    <aside className="h-fit rounded-[2rem] bg-[#082b62] p-5 text-white shadow-xl sm:p-8">
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#c9f23b]">Order summary</p>
      <h2 className="mt-2 text-2xl font-black">Your essentials</h2>
      <div className="mt-6 space-y-4">
        {cart.map((item: CartItem) => (
          <div key={item.id} className="flex gap-3 border-b border-white/10 pb-4">
            <img src={item.image} alt={item.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold leading-snug">{item.name}</p>
              <p className="mt-0.5 text-xs text-blue-200">
                {formatPrice(item.price)} · {item.unit}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <QuantityStepper quantity={item.quantity} onChange={(next: number) => setQuantity(item.id, next)} label={item.name} max={item.stock} size="sm" tone="dark" />
                <span className="ml-auto text-sm font-black">{formatPrice(item.price * item.quantity)}</span>
              </div>
            </div>
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
    <main className="mx-auto max-w-2xl px-5 py-10">
      <CheckoutSteps step={steps.length} />
      <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-blue-100 sm:p-14">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-[#159a7a]">
          <Check size={40} />
        </div>
        <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.18em] text-[#159a7a]">Order confirmed</p>
        <h1 className="mt-3 text-4xl font-black text-[#082b62]">Your care package is on its way.</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-500">
          Order #{order.id} for {formatPrice(order.total)} has been received{order.paymentMethod === 'cod' ? ' — please keep the cash ready at delivery' : ''}. We will send dispatch
          updates to {order.delivery.phone}.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/orders" className="rounded-full bg-[#0b6fce] px-7 py-4 font-extrabold text-white transition hover:bg-[#082b62]">
            View my orders
          </Link>
          <Link to="/#products" className="rounded-full border-2 border-slate-200 px-7 py-4 font-extrabold text-[#082b62] transition hover:border-[#0b6fce] hover:text-[#0b6fce]">
            Continue shopping
          </Link>
        </div>
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
