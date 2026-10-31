import { useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { MAX_QUANTITY } from '@/lib/cart';

type QuantityStepperProps = {
  quantity: number;
  onChange: (quantity: number) => void;
  label: string;
  max?: number; // what's in stock; never above MAX_QUANTITY
  size?: 'sm' | 'md' | 'lg';
  tone?: 'brand' | 'light' | 'dark';
};

const sizes = {
  sm: { box: 'h-8', button: 'w-8', input: 'w-8 text-sm', icon: 13 },
  md: { box: 'h-10', button: 'w-10', input: 'w-8 text-sm', icon: 15 },
  lg: { box: 'h-14', button: 'w-14', input: 'w-12 text-lg', icon: 18 },
};

const tones = {
  brand: { box: 'bg-brand text-white shadow-lg', button: 'hover:bg-white/15' },
  light: { box: 'bg-slate-100 text-navy', button: 'hover:bg-slate-200' },
  dark: { box: 'bg-white/10 text-white', button: 'hover:bg-white/20' },
};

// − [qty] + control used wherever a cart quantity is shown. At 1 the minus becomes a bin that removes
// the item, and the number can be typed for bulk orders (empty or 0 falls back to the current value).
export function QuantityStepper({ quantity, onChange, label, max = MAX_QUANTITY, size = 'md', tone = 'brand' }: QuantityStepperProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const limit = Math.min(max, MAX_QUANTITY);
  const { box, button, input, icon } = sizes[size];
  const colors = tones[tone];
  const buttonClass = `flex h-full ${button} shrink-0 items-center justify-center rounded-md transition ${colors.button} disabled:opacity-40 disabled:hover:bg-transparent`;

  const type = (event: ChangeEvent<HTMLInputElement>): void => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, String(MAX_QUANTITY).length);
    setDraft(digits);
    if (Number(digits) >= 1) onChange(Number(digits));
  };

  const blurOnEnter = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') event.currentTarget.blur();
  };

  return (
    <div className={`inline-flex shrink-0 items-center rounded-lg ${box} ${colors.box}`}>
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label={quantity === 1 ? `Remove ${label} from cart` : `Decrease ${label} quantity`}
        className={buttonClass}
      >
        {quantity === 1 ? <Trash2 size={icon} /> : <Minus size={icon} />}
      </button>
      <input
        value={draft ?? quantity}
        onChange={type}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={() => setDraft(null)}
        onKeyDown={blurOnEnter}
        inputMode="numeric"
        aria-label={`Quantity of ${label}`}
        className={`${input} bg-transparent text-center font-bold outline-none`}
      />
      <button type="button" onClick={() => onChange(quantity + 1)} disabled={quantity >= limit} aria-label={`Increase ${label} quantity`} className={buttonClass}>
        <Plus size={icon} />
      </button>
    </div>
  );
}
