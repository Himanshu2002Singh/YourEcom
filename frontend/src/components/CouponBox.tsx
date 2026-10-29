import { useEffect, useState, type FormEvent } from 'react';
import { TicketPercent } from 'lucide-react';
import { ApiError, api } from '@/lib/api';
import { describeCoupon, discountFor, formatPrice } from '@/lib/pricing';
import type { Coupon } from '@/types/store';

type CouponBoxProps = { subtotal: number; coupon: Coupon | null; setCoupon: (coupon: Coupon | null) => void };

// The checkout's coupon field and the offers this customer can still use. Sits on the dark order summary.
export function CouponBox({ subtotal, coupon, setCoupon }: CouponBoxProps) {
  const [offers, setOffers] = useState<Coupon[]>([]);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  // The offers are a shortcut: if they can't load, a typed code still works.
  useEffect(() => {
    let current = true;
    api<{ coupons: Coupon[] }>('/coupons')
      .then(({ coupons }) => current && setOffers(coupons))
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, []);

  const apply = (next: Coupon): void => {
    if (subtotal < next.minSubtotal) return setError(`Add ${formatPrice(next.minSubtotal - subtotal)} more to your cart to use ${next.code}.`);
    setError('');
    setCode('');
    setCoupon(next);
  };

  // The server says whether this customer can use the code; the minimum order is checked here.
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!code.trim()) return setError('Enter a coupon code.');
    setChecking(true);
    try {
      apply((await api<{ coupon: Coupon }>(`/coupons/${encodeURIComponent(code.trim())}`)).coupon);
    } catch (failure) {
      setError((failure as ApiError).message);
    } finally {
      setChecking(false);
    }
  };

  const discount = coupon ? discountFor(coupon, subtotal) : 0;

  return (
    <div className="mt-6 rounded-2xl bg-white/5 p-4">
      <p className="flex items-center gap-2 text-sm font-extrabold">
        <TicketPercent size={17} className="text-[#c9f23b]" /> Coupons and offers
      </p>
      {coupon ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-[#c9f23b]/70 px-3 py-2.5">
          <div className="min-w-0" aria-live="polite">
            <p className="font-black tracking-wide text-[#c9f23b]">{coupon.code} applied</p>
            <p className="text-xs leading-5 text-blue-200">
              {discount > 0 ? `You save ${formatPrice(discount)}` : `Add ${formatPrice(coupon.minSubtotal - subtotal)} more to your cart to use this code`}
            </p>
          </div>
          <button onClick={() => setCoupon(null)} className="shrink-0 rounded-full px-2 py-1 text-xs font-extrabold text-blue-100 transition hover:text-white">
            Remove
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={submit} noValidate className="mt-3 flex gap-2">
            <label htmlFor="coupon-code" className="sr-only">
              Coupon code
            </label>
            <input
              id="coupon-code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setError('');
              }}
              placeholder="Enter coupon code"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={30}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'coupon-error' : undefined}
              className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white placeholder:font-semibold placeholder:normal-case placeholder:tracking-normal placeholder:text-blue-200 focus:border-[#c9f23b] focus:outline-none"
            />
            <button
              type="submit"
              disabled={checking}
              className="shrink-0 rounded-full bg-[#c9f23b] px-4 py-2.5 text-sm font-black text-[#082b62] transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
            >
              {checking ? 'Checking…' : 'Apply'}
            </button>
          </form>
          {error && (
            <p id="coupon-error" role="alert" className="mt-2 text-xs font-bold leading-5 text-rose-200">
              {error}
            </p>
          )}
          {offers.length > 0 && (
            <ul className="mt-3 space-y-2" aria-label="Offers you can use">
              {offers.map((offer: Coupon) => {
                const short = offer.minSubtotal - subtotal;
                return (
                  <li key={offer.code} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-black tracking-wide text-white">{offer.code}</p>
                      <p className="text-xs leading-5 text-blue-200">
                        {describeCoupon(offer)}
                        {short > 0 && ` · add ${formatPrice(short)} more`}
                      </p>
                    </div>
                    <button
                      onClick={() => apply(offer)}
                      disabled={short > 0}
                      aria-label={`Apply ${offer.code}`}
                      className="shrink-0 rounded-full px-2 py-1 text-xs font-black text-[#c9f23b] transition hover:text-white disabled:cursor-not-allowed disabled:text-blue-300/60"
                    >
                      Apply
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
