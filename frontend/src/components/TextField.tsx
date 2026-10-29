import type { InputHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  suffix?: ReactNode;
  wide?: boolean;
};

// Labelled input with an optional leading icon, trailing control and an inline hint or error message.
export function TextField({ name, label, error, hint, icon: Icon, suffix, wide, ...input }: TextFieldProps) {
  const messageId = `${name}-message`;
  const message = error ?? hint;
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <label htmlFor={name} className="mb-2 block text-sm font-extrabold text-[#082b62]">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 rounded-2xl border bg-slate-50 px-4 transition focus-within:bg-white ${error ? 'border-rose-400 focus-within:border-rose-500' : 'border-slate-200 focus-within:border-[#0b6fce]'}`}
      >
        {Icon && <Icon size={17} className="shrink-0 text-slate-400" />}
        <input
          id={name}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...input}
          className="w-full min-w-0 bg-transparent py-3.5 outline-none placeholder:text-slate-400"
        />
        {suffix}
      </div>
      {message && (
        <p id={messageId} className={`mt-1.5 text-xs font-semibold ${error ? 'text-rose-500' : 'text-slate-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
