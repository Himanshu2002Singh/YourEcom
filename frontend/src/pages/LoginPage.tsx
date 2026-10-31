import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { TextField } from '@/components/TextField';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { User } from '@/types/store';

type Mode = 'login' | 'signup';
type Field = 'name' | 'email' | 'password';
type LoginPageProps = {
  user: User | null | undefined; // undefined while the session is being checked
  // Signs in or creates the account through the API; rejects with a message to show.
  signIn: (details: { mode: Mode } & Record<Field, string>) => Promise<void>;
};

const errorFor = (field: Field, value: string): string | undefined => {
  if (field === 'name') return value.trim() ? undefined : 'Enter your full name';
  if (field === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : 'Enter a valid email address';
  return value.length >= 6 ? undefined : 'Password must be at least 6 characters';
};

export function LoginPage({ user, signIn }: LoginPageProps) {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [mode, setMode] = useState<Mode>('login');
  const [values, setValues] = useState<Record<Field, string>>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState('');
  const isLogin = mode === 'login';
  usePageTitle(isLogin ? 'Sign in' : 'Create account');

  // Signed in (already, or just now via submit): continue to the page that sent us here.
  if (user) return <Navigate to={from ?? '/profile'} replace />;

  const update = (event: ChangeEvent<HTMLInputElement>): void => {
    const field = event.target.name as Field;
    const value = event.target.value;
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: errorFor(field, value) }));
  };

  const switchMode = (next: Mode): void => {
    setMode(next);
    setErrors({});
    setFormError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const fields: Field[] = isLogin ? ['email', 'password'] : ['name', 'email', 'password'];
    const nextErrors: Partial<Record<Field, string>> = {};
    fields.forEach((field: Field) => {
      nextErrors[field] = errorFor(field, values[field]);
    });
    setErrors(nextErrors);
    const firstInvalid = fields.find((field: Field) => nextErrors[field]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    setPending(true);
    setFormError('');
    try {
      // On success the user prop arrives and the redirect above takes over.
      await signIn({ mode, name: values.name.trim(), email: values.email.trim().toLowerCase(), password: values.password });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong. Try again.');
      setPending(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-120px)] bg-brand-soft px-5 py-12">
      <div className="mx-auto grid max-w-5xl grid-cols-1 overflow-hidden rounded-xl bg-white shadow-xl lg:grid-cols-2">
        <div className="hidden bg-navy p-12 lg:block">
          <div className="flex h-full flex-col justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-200">Your YourEcom account</p>
              <p className="mt-4 font-display text-4xl font-semibold leading-tight text-white">Order syringes and medical disposables in a few clicks.</p>
              <p className="mt-6 max-w-sm leading-7 text-blue-100">Save your delivery details, track your orders and reorder the supplies your hospital, clinic or store uses most.</p>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-white">
              <ShieldCheck className="text-emerald-300" /> Your details stay private
            </div>
          </div>
        </div>
        <div className="p-7 sm:p-12">
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand">
            <ArrowLeft size={16} /> Back to store
          </Link>
          <div className="flex gap-7 border-b border-slate-100">
            {(['login', 'signup'] as const).map((value: Mode) => (
              <button
                key={value}
                type="button"
                onClick={() => switchMode(value)}
                aria-pressed={mode === value}
                className={`pb-4 text-sm font-semibold ${mode === value ? 'border-b-2 border-brand text-brand' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {value === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>
          <h1 className="mt-8 text-3xl font-semibold text-navy">{isLogin ? 'Welcome back.' : 'Join YourEcom.'}</h1>
          <p className="mt-2 text-slate-500">
            {from ? 'Please sign in to continue.' : isLogin ? 'Sign in to view your orders and saved details.' : 'Create your account for a smoother care experience.'}
          </p>
          <form noValidate onSubmit={submit} className="mt-7 space-y-4">
            {!isLogin && (
              <TextField name="name" label="Full name" icon={UserRound} autoComplete="name" placeholder="Aarav Singh" value={values.name} onChange={update} error={errors.name} />
            )}
            <TextField
              name="email"
              label="Email address"
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={update}
              error={errors.email}
            />
            <TextField
              name="password"
              label="Password"
              icon={LockKeyhole}
              type={showPassword ? 'text' : 'password'}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder="Min. 6 characters"
              value={values.password}
              onChange={update}
              error={errors.password}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="-m-2 shrink-0 rounded-full p-2 text-slate-400 transition hover:text-brand"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              }
            />
            {isLogin && (
              <p className="-mt-1 text-right text-sm">
                <Link to="/forgot-password" state={{ email: values.email.trim() }} className="font-bold text-brand hover:underline">
                  Forgot password?
                </Link>
              </p>
            )}
            {formError && (
              <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-brand py-4 font-semibold text-white transition hover:bg-navy disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? 'Please wait…' : isLogin ? 'Sign in to YourEcom' : 'Create my account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm font-semibold text-slate-400">
            By continuing, you agree to our{' '}
            <Link to="/policies/terms" className="text-slate-500 underline underline-offset-2 hover:text-brand">
              terms of use
            </Link>{' '}
            and{' '}
            <Link to="/policies/privacy" className="text-slate-500 underline underline-offset-2 hover:text-brand">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
