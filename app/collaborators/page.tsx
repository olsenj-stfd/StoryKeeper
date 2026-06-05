'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase-client';
import { DEFAULT_FAMILY_ID } from '@/lib/seed';

type Invite = {
  id: string;
  email: string;
  status: string;
  created_at: string;
};

export default function CollaboratorsPage() {
  const { user, loading: authLoading } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const c = getSupabaseClient();
    if (!c) return;
    const { data } = await c
      .from('invites')
      .select('*')
      .eq('family_id', DEFAULT_FAMILY_ID)
      .order('created_at', { ascending: false });
    setInvites((data ?? []) as Invite[]);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const c = getSupabaseClient();
    if (!c) {
      setError('Supabase not configured.');
      return;
    }
    if (!user) {
      setError('You need to sign in to invite collaborators.');
      return;
    }
    setBusy(true);
    const token = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const { error: insertErr } = await c.from('invites').insert({
      id: token,
      family_id: DEFAULT_FAMILY_ID,
      email: newEmail.trim().toLowerCase(),
      created_by: user.id,
      status: 'pending',
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    setBusy(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    setInfo(
      `Invite created. Send this link to ${newEmail}: ${window.location.origin}/signup?invite=${token}`,
    );
    setNewEmail('');
    refresh();
  };

  if (authLoading) {
    return (
      <div className="flex-1 px-5 py-8 max-w-2xl w-full mx-auto annotation">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 px-5 py-8 max-w-2xl w-full mx-auto">
        <header className="mb-6">
          <div className="annotation">MOONJAR STORIES &middot; COLLABORATORS</div>
          <div className="font-display text-2xl mt-1">
            <span className="marker-highlight">SIGN IN</span> first
          </div>
        </header>
        <p className="font-bold mb-4">
          You need to be signed in to invite other storytellers.
        </p>
        <Link href="/signin" className="sketched-btn marker-kid">
          SIGN IN
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 px-5 py-8 max-w-2xl w-full mx-auto">
      <header className="mb-6 pb-3 border-b-2 border-ink/40">
        <div className="annotation">MOONJAR STORIES &middot; COLLABORATORS</div>
        <div className="font-display text-2xl mt-1">
          Invite <span className="marker-highlight">STORYTELLERS</span>
        </div>
        <div className="text-sm text-muted mt-1">
          Add grandparents, aunts, uncles, or anyone trusted who&rsquo;ll
          record stories for the same listeners.
        </div>
      </header>

      <section className="mb-8 bg-white border-[3px] border-ink rounded-2xl p-5 chunky-shadow">
        <div className="annotation ink mb-2">YOU</div>
        <div className="font-bold">{user.email}</div>
        <div className="annotation mt-1">Owner</div>
      </section>

      <section className="mb-8 bg-white border-[3px] border-ink rounded-2xl p-5 chunky-shadow">
        <div className="annotation ink mb-3">INVITE BY EMAIL</div>
        <form onSubmit={invite} className="flex gap-2 flex-wrap">
          <input
            type="email"
            required
            placeholder="grandma@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="sketched-btn marker-kid disabled:opacity-60"
          >
            {busy ? 'SENDING…' : 'SEND INVITE'}
          </button>
        </form>
        {error && (
          <div className="mt-3 text-sm font-bold text-[#c64a4a]">{error}</div>
        )}
        {info && (
          <div className="mt-3 text-xs break-all bg-yellow/20 border border-ink/40 rounded-lg p-2 font-mono">
            {info}
          </div>
        )}
      </section>

      <section>
        <div className="annotation ink mb-3">INVITES SENT</div>
        {invites.length === 0 ? (
          <div className="text-sm text-muted italic">
            No invites sent yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {invites.map((i) => (
              <li
                key={i.id}
                className="bg-white border-2 border-ink rounded-lg px-3 py-2 flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-sm">{i.email}</div>
                  <div className="annotation">
                    {new Date(i.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span className="tag-badge">{i.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
