'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { getSupabaseClient, supabaseConfigured } from '@/lib/supabase-client';

function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const inviteToken = params.get('invite');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const client = getSupabaseClient();
    if (!client) {
      setError('Supabase not configured. Add env vars on Vercel.');
      return;
    }
    setBusy(true);
    const { error: authErr } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: inviteToken ? { invite_token: inviteToken } : undefined,
      },
    });
    setBusy(false);
    if (authErr) {
      setError(authErr.message);
      return;
    }
    setInfo(
      'Check your inbox to confirm your email, then sign in. (Email confirmation can be turned off in Supabase Auth settings.)',
    );
    setTimeout(() => router.push('/signin'), 4000);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 paper-grid gap-6">
      <div className="text-center max-w-md">
        <div className="font-display text-3xl leading-tight">
          <span className="marker-highlight">SIGN</span> UP
        </div>
        {inviteToken ? (
          <div className="annotation mt-3">
            you were invited to join a family
          </div>
        ) : (
          <div className="annotation mt-3">start a Moonjar Stories account</div>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white border-[3px] border-ink rounded-2xl p-6 chunky-shadow space-y-4"
      >
        <label className="block">
          <div className="annotation mb-1">EMAIL</div>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <div className="annotation mb-1">PASSWORD</div>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm"
            minLength={6}
          />
        </label>

        {error && (
          <div className="text-sm font-bold text-[#c64a4a]">{error}</div>
        )}
        {info && <div className="text-sm font-bold">{info}</div>}
        {!supabaseConfigured() && (
          <div className="annotation">
            Supabase env vars not set — sign-up won&rsquo;t work in this build.
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="sketched-btn marker-kid w-full disabled:opacity-60"
        >
          {busy ? 'CREATING…' : 'CREATE ACCOUNT'}
        </button>
      </form>

      <div className="annotation">
        Already have an account?{' '}
        <Link href="/signin" className="underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center annotation">
          Loading…
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
