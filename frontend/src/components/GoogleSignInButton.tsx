import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type ButtonText = 'signin_with' | 'signup_with';

// The parts of Google Identity Services (https://accounts.google.com/gsi/client) this button uses.
type GoogleId = {
  initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
  renderButton: (
    parent: HTMLElement,
    options: { type: 'standard'; theme: 'outline'; size: 'large'; text: ButtonText; shape: 'rectangular'; logo_alignment: 'center'; width: number },
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

let library: Promise<GoogleId> | undefined; // Google's script, loaded once per visit
let initializedFor = ''; // the client ID Google was set up with
let onCredential: (credential: string) => void = () => undefined; // the mounted button's handler

const loadGoogle = (): Promise<GoogleId> =>
  (library ??= new Promise<GoogleId>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => (window.google ? resolve(window.google.accounts.id) : reject(new Error('Google sign-in didn’t load')));
    script.onerror = () => {
      library = undefined; // a later visit to the page tries again
      script.remove();
      reject(new Error('Google sign-in didn’t load'));
    };
    document.head.append(script);
  }));

// "Sign in with Google", drawn by Google's own script, when the API has a Google client ID (GET /api/auth/google).
// Otherwise, or without the API (the Vercel preview), it shows nothing. Google's ID token goes to onSignIn.
export function GoogleSignInButton({ text, onSignIn }: { text: ButtonText; onSignIn: (credential: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    onCredential = onSignIn;
  }, [onSignIn]);

  useEffect(() => {
    let active = true;
    api<{ clientId: string | null }>('/auth/google')
      .then(({ clientId: id }) => {
        if (active) setClientId(id);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!clientId) return undefined;
    let active = true;
    loadGoogle()
      .then((google: GoogleId) => {
        const parent = box.current;
        if (!active || !parent) return;
        if (initializedFor !== clientId) {
          google.initialize({ client_id: clientId, callback: ({ credential }) => onCredential(credential) });
          initializedFor = clientId;
        }
        parent.replaceChildren();
        const width = Math.min(400, Math.max(200, parent.clientWidth));
        google.renderButton(parent, { type: 'standard', theme: 'outline', size: 'large', text, shape: 'rectangular', logo_alignment: 'center', width });
      })
      .catch(() => undefined); // Google's script blocked or offline: the email form still works
    return () => {
      active = false;
    };
  }, [clientId, text]);

  if (!clientId) return null;
  return (
    <>
      <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div ref={box} className="flex min-h-11 justify-center" />
    </>
  );
}
