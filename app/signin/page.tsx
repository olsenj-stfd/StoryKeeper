'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getSupabaseClient, supabaseConfigured } from '@/lib/supabase-client';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const client = getSupabaseClient();
    if (!client) {
      setError('Supabase not configured. Add env vars on Vercel.');
      return;
    }
    setBusy(true);
    const { error: authErr } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (authErr) {
      setError(authErr.message);
      return;
    }
    router.push('/');
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 paper-grid gap-6">
      <div className="text-center max-w-md">
        <div className="font-display text-3xl leading-tight">
          <span className="marker-highlight">SIGN</span> IN
        </div>
        <div className="annotation mt-3">
          back to your family&rsquo;s stories
        </div>
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm"
          />
        </label>

        {error && (
          <div className="text-sm font-bold text-[#c64a4a]">{error}</div>
        )}
        {!supabaseConfigured() && (
          <div className="annotation">
            Supabase env vars not set — sign-in won&rsquo;t work in this build.
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="sketched-btn marker-kid w-full disabled:opacity-60"
        >
          {busy ? 'SIGNING IN…' : 'SIGN IN'}
        </button>
      </form>

      <div className="annotation">
        No account?{' '}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}
