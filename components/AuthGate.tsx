'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabaseConfigured } from '@/lib/supabase-client';

// Gates a route on sign-in. When the user isn't authenticated, redirects
// to /signin. While we're hydrating the session, renders a light
// placeholder so we don't flash protected content.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user && supabaseConfigured()) {
      router.replace('/signin');
    }
  }, [loading, user, router]);

  if (!supabaseConfigured()) {
    // Local dev / non-Supabase environments — auth isn't enforceable.
    return (
      <div className="flex-1">
        <div className="px-4 py-2 text-xs text-muted italic text-center">
          Auth not configured locally — running open.
        </div>
        {children}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="annotation">Checking your account…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-4">
        <div className="annotation ink">PLEASE SIGN IN</div>
        <Link href="/signin" className="sketched-btn marker-kid">
          GO TO SIGN IN
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
