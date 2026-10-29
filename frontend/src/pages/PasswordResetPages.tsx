import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Eye, EyeOff, KeyRound, LockKeyhole, Mail, MailCheck } from 'lucide-react';
import { TextField } from '@/components/TextField';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ApiError, api } from '@/lib/api';

// The two steps of a forgotten password: ask for an emailed link, then choose a new password from it.

function Card({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#eaf7ff] px-5 py-12">
      <div className="mx-auto max-w-md rounded-[2rem] bg-white p-7 shadow-2xl shadow-blue-100 sm:p-10">
        <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0b6fce]">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
        {children}
      </div>
    </main>
  );
}

const FormError = ({ message }: { message: string }) =>
  message ? (
    <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
      {message}
    </p>
  ) : null;

export function ForgotPasswordPage() {
  const location = useLocation();
  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email ?? '');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState('');
  usePageTitle('Forgot password');

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setEmailError('Enter a valid email address');
      document.getElementById('email')?.focus();
      return;
    }
    setPending(true);
    setFormError('');
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email: clean } });
      setSentTo(clean);
    } catch (error) {
      setFormError((error as ApiError).message);
    } finally {
      setPending(false);
    }
  };

  if (sentTo) {
    return (
      <Card>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#159a7a]">
          <MailCheck size={28} />
        </div>
        <h1 className="mt-6 text-3xl font-black text-[#082b62]">Check your email</h1>
        <p className="mt-3 leading-7 text-slate-500">
          If there’s a YourEcom account for <strong className="break-all text-[#082b62]">{sentTo}</strong>, we’ve sent it a link to choose a new password. The link works for 30
          minutes.
        </p>
        <p className="mt-6 text-sm text-slate-500">
          Nothing arrived? Check your spam folder, or{' '}
          <button onClick={() => setSentTo('')} className="font-bold text-[#0b6fce] hover:underline">
            send another link
          </button>
          .
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-3xl font-black text-[#082b62]">Forgot your password?</h1>
      <p className="mt-2 text-slate-500">Enter the email you signed up with and we’ll send you a link to choose a new one.</p>
      <form noValidate onSubmit={submit} className="mt-7 space-y-4">
        <TextField
          name="email"
          label="Email address"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError('');
          }}
          error={emailError}
        />
        <FormError message={formError} />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[#0b6fce] py-4 font-extrabold text-white transition hover:bg-[#082b62] disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? 'Sending…' : 'Email me a reset link'}
        </button>
      </form>
    </Card>
  );
}

// Opened from the emailed link (/reset-password?token=…). resetPassword rejects with the API's message.
export function ResetPasswordPage({ resetPassword }: { resetPassword: (token: string, password: string) => Promise<void> }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  usePageTitle('Choose a new password');

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      document.getElementById('password')?.focus();
      return;
    }
    setPending(true);
    setFormError('');
    try {
      await resetPassword(token, password);
      navigate('/profile', { replace: true });
    } catch (error) {
      setFormError((error as ApiError).message);
      setPending(false);
    }
  };

  if (!token) {
    return (
      <Card>
        <h1 className="text-3xl font-black text-[#082b62]">This link is incomplete</h1>
        <p className="mt-3 leading-7 text-slate-500">Open the link from your email again, or ask for a new one.</p>
        <Link to="/forgot-password" className="mt-7 inline-flex rounded-full bg-[#0b6fce] px-6 py-3.5 font-extrabold text-white transition hover:bg-[#082b62]">
          Send a new link
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-[#0b6fce]">
        <KeyRound size={26} />
      </div>
      <h1 className="mt-6 text-3xl font-black text-[#082b62]">Choose a new password</h1>
      <p className="mt-2 text-slate-500">You’ll be signed in, and signed out on every other device.</p>
      <form noValidate onSubmit={submit} className="mt-7 space-y-4">
        <TextField
          name="password"
          label="New password"
          icon={LockKeyhole}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Min. 6 characters"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setPasswordError('');
          }}
          error={passwordError}
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
        <FormError message={formError} />
        {formError.includes('Ask for a new one') && (
          <Link to="/forgot-password" className="block text-sm font-bold text-[#0b6fce] hover:underline">
            Send me a new link
          </Link>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[#0b6fce] py-4 font-extrabold text-white transition hover:bg-[#082b62] disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </Card>
  );
}
