import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ArrowRight, KeyRound, LockKeyhole, MapPin, PackageOpen, UserRound } from 'lucide-react';
import { TextField } from '@/components/TextField';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatPrice } from '@/lib/pricing';
import type { Order, OrderItem, User } from '@/types/store';

type ProfilePageProps = {
  user: User;
  orders: Order[];
  signOut: () => void;
  updatePreferences: (preferences: User['preferences']) => void;
  saveName: (name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

type SaveState = { saving: boolean; error: string; done: string };
const idle: SaveState = { saving: false, error: '', done: '' };

// A form's save button with the line beside it: the API's error, or a short confirmation.
function SaveRow({ label, state, disabled }: { label: string; state: SaveState; disabled?: boolean }) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={state.saving || disabled}
        className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state.saving ? 'Saving…' : label}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm font-semibold text-rose-500">
          {state.error}
        </p>
      ) : (
        state.done && (
          <p role="status" className="text-sm font-semibold text-leaf">
            {state.done}
          </p>
        )
      )}
    </div>
  );
}

function NameForm({ name, saveName }: { name: string; saveName: ProfilePageProps['saveName'] }) {
  const [value, setValue] = useState(name);
  const [state, setState] = useState<SaveState>(idle);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!value.trim()) return setState({ ...idle, error: 'Enter your full name' });
    setState({ ...idle, saving: true });
    try {
      await saveName(value.trim());
      setState({ ...idle, done: 'Name saved' });
    } catch (error) {
      setState({ ...idle, error: (error as Error).message });
    }
  };

  return (
    <form onSubmit={submit} noValidate className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-navy">Your name</h2>
      <p className="mt-1 text-sm text-slate-500">Used on your account and as the default name for deliveries.</p>
      <div className="mt-6">
        <TextField
          name="profile-name"
          label="Full name"
          icon={UserRound}
          autoComplete="name"
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setValue(event.target.value);
            setState(idle);
          }}
        />
      </div>
      <SaveRow label="Save name" state={state} disabled={value.trim() === name} />
    </form>
  );
}

function PasswordForm({ changePassword }: { changePassword: ProfilePageProps['changePassword'] }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [state, setState] = useState<SaveState>(idle);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!current) return setState({ ...idle, error: 'Enter your current password' });
    if (next.length < 6) return setState({ ...idle, error: 'New password must be at least 6 characters' });
    setState({ ...idle, saving: true });
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setState({ ...idle, done: 'Password changed. Other devices have been signed out.' });
    } catch (error) {
      setState({ ...idle, error: (error as Error).message });
    }
  };

  const typed = (set: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
    set(event.target.value);
    setState(idle);
  };

  return (
    <form onSubmit={submit} noValidate className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-navy">Change password</h2>
      <p className="mt-1 text-sm text-slate-500">You’ll stay signed in here; other devices are signed out.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <TextField name="current-password" label="Current password" type="password" icon={LockKeyhole} autoComplete="current-password" value={current} onChange={typed(setCurrent)} />
        <TextField name="new-password" label="New password" type="password" icon={KeyRound} autoComplete="new-password" hint="At least 6 characters" value={next} onChange={typed(setNext)} />
      </div>
      <SaveRow label="Change password" state={state} />
    </form>
  );
}

const preferenceOptions: [keyof User['preferences'], string][] = [
  ['smsUpdates', 'Order updates by SMS'],
  ['offers', 'Care tips & offers'],
];

export function ProfilePage({ user, orders, signOut, updatePreferences, saveName, changePassword }: ProfilePageProps) {
  usePageTitle('My account');
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const kept = orders.filter((order: Order) => order.status !== 'Cancelled'); // cancelled orders don't count
  const itemsOrdered = kept.reduce((total: number, order: Order) => total + order.items.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0), 0);
  const totalSpent = kept.reduce((total: number, order: Order) => total + order.total, 0);
  const savedAddress = orders[0]?.delivery;
  const stats = [
    [String(kept.length), kept.length === 1 ? 'Order placed' : 'Orders placed'],
    [String(itemsOrdered), itemsOrdered === 1 ? 'Item ordered' : 'Items ordered'],
    [formatPrice(totalSpent), 'Total spent'],
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-leaf">Your account</p>
          <h1 className="mt-2 break-words text-4xl font-semibold text-navy">Hello, {user.name.split(' ')[0]}.</h1>
          <p className="mt-2 text-slate-500">Manage your details and keep your care essentials close.</p>
        </div>
        <button
          onClick={signOut}
          className="self-start rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-brand hover:text-brand"
        >
          Sign out
        </button>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="min-w-0 rounded-xl bg-navy p-6 text-white lg:col-span-2">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
            <div className="min-w-0 max-w-full">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white text-2xl font-bold text-navy">{initials}</div>
              <h2 className="mt-5 break-words text-2xl font-semibold">{user.name}</h2>
              <p className="mt-1 break-words text-blue-200">{user.email}</p>
            </div>
            <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-blue-100">Member since {user.memberSince}</span>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {stats.map(([value, label]) => (
              <div key={label} className="rounded-xl bg-white/10 p-4">
                <p className="text-2xl font-bold">{value}</p>
                <p className="mt-1 text-xs text-blue-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <Link to="/orders" className="group rounded-xl border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <PackageOpen />
          </div>
          <h3 className="mt-5 text-xl font-bold text-navy">My orders</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">Track deliveries and view your purchase history.</p>
          <span className="mt-5 flex items-center gap-2 text-sm font-semibold text-brand">
            View orders <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-navy">Saved address</h2>
          {savedAddress ? (
            <div className="mt-6 flex gap-3">
              <div className="h-fit rounded-xl bg-emerald-50 p-3 text-leaf">
                <MapPin size={19} />
              </div>
              <div>
                <p className="font-semibold text-navy">{savedAddress.name}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {savedAddress.address},
                  <br />
                  {savedAddress.city} – {savedAddress.pincode}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-600">{savedAddress.phone}</p>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm leading-6 text-slate-500">Your delivery address is saved here after your first order.</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-navy">Account preferences</h2>
          <div className="mt-6 space-y-4">
            {preferenceOptions.map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center justify-between text-sm font-bold text-slate-600">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={user.preferences[key]}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => updatePreferences({ ...user.preferences, [key]: event.target.checked })}
                  className="h-5 w-5 accent-brand"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <NameForm name={user.name} saveName={saveName} />
        <PasswordForm changePassword={changePassword} />
      </div>
    </main>
  );
}
