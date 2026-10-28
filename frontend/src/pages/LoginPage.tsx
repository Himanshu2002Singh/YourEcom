import { useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { ArrowLeft, LockKeyhole, Mail, ShieldCheck, UserRound, type LucideIcon } from 'lucide-react';
import type { User } from '@/types/store';

type LoginPageProps = { user: User | null; signIn: (name: string, email: string) => void };
type IconInputProps = { label: string; icon: LucideIcon } & InputHTMLAttributes<HTMLInputElement>;

// "aarav.singh@example.com" -> "Aarav Singh"; used when signing in without a name field.
const nameFromEmail = (email: string): string =>
  email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part: string) => part[0].toUpperCase() + part.slice(1))
    .join(' ') || email;

function IconInput({ label, icon: Icon, ...input }: IconInputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-[#082b62]">{label}</span>
      <span className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-[#0b6fce] focus-within:bg-white">
        <Icon size={17} className="shrink-0 text-slate-400" />
        <input required {...input} className="w-full bg-transparent py-3.5 outline-none" />
      </span>
    </label>
  );
}

export function LoginPage({ user, signIn }: LoginPageProps) {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isLogin = mode === 'login';

  // Signed in (already, or just now via submit): continue to the page that sent us here.
  if (user) return <Navigate to={from ?? '/profile'} replace />;

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    signIn(isLogin ? nameFromEmail(cleanEmail) : name.trim(), cleanEmail);
  };

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#eaf7ff] px-5 py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-blue-100 lg:grid-cols-2">
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
            {(['login', 'signup'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
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
          <form onSubmit={submit} className="mt-7 space-y-4">
            {!isLogin && (
              <IconInput label="Full name" icon={UserRound} autoComplete="name" value={name} onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)} placeholder="Aarav Singh" />
            )}
            <IconInput
              label="Email address"
              icon={Mail}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
            <IconInput
              label="Password"
              icon={LockKeyhole}
              type="password"
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
            />
            <button type="submit" className="w-full rounded-full bg-[#0b6fce] py-4 font-extrabold text-white transition hover:bg-[#082b62]">
              {isLogin ? 'Sign in to YourEcom' : 'Create my account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm font-semibold text-slate-400">By continuing, you agree to our terms and privacy policy.</p>
        </div>
      </div>
    </main>
  );
}
