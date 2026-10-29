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
    <main className="min-h-[calc(100vh-120px)] bg-[#eaf7ff] px-5 py-12">
      <div className="mx-auto grid max-w-5xl grid-cols-1 overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-blue-100 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-[#082b62] p-12 lg:block">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0b86d8]/40 blur-2xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#159a7a]/30 blur-2xl" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c9f23b] text-3xl font-black text-[#082b62]">+</span>
              <p className="mt-12 text-sm font-extrabold uppercase tracking-[0.18em] text-[#c9f23b]">Your healthcare shelf</p>
              <p className="mt-4 font-['Plus_Jakarta_Sans'] text-5xl font-black leading-tight text-white">
                Care that
                <br />
                <span className="text-[#57c4ff]">stays close.</span>
              </p>
              <p className="mt-6 max-w-sm leading-7 text-blue-100">Save your details, track orders and get faster access to the supplies your family or practice needs.</p>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-white">
              <ShieldCheck className="text-[#c9f23b]" /> Safe, private and simple
            </div>
          </div>
        </div>
        <div className="p-7 sm:p-12">
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0b6fce]">
            <ArrowLeft size={16} /> Back to store
          </Link>
          <div className="flex gap-7 border-b border-slate-100">
            {(['login', 'signup'] as const).map((value: Mode) => (
              <button
                key={value}
                type="button"
                onClick={() => switchMode(value)}
                aria-pressed={mode === value}
                className={`pb-4 text-sm font-extrabold ${mode === value ? 'border-b-2 border-[#0b6fce] text-[#0b6fce]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {value === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>
          <h1 className="mt-8 text-3xl font-black text-[#082b62]">{isLogin ? 'Welcome back.' : 'Join YourEcom.'}</h1>
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
                  className="-m-2 shrink-0 rounded-full p-2 text-slate-400 transition hover:text-[#0b6fce]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              }
            />
            {isLogin && (
              <p className="-mt-1 text-right text-sm">
                <Link to="/forgot-password" state={{ email: values.email.trim() }} className="font-bold text-[#0b6fce] hover:underline">
                  Forgot password?
                </Link>
              </p>
            )}
            {formError && (
              <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-[#0b6fce] py-4 font-extrabold text-white transition hover:bg-[#082b62] disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? 'Please wait…' : isLogin ? 'Sign in to YourEcom' : 'Create my account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm font-semibold text-slate-400">
            By continuing, you agree to our{' '}
            <Link to="/policies/terms" className="text-slate-500 underline underline-offset-2 hover:text-[#0b6fce]">
              terms of use
            </Link>{' '}
            and{' '}
            <Link to="/policies/privacy" className="text-slate-500 underline underline-offset-2 hover:text-[#0b6fce]">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
