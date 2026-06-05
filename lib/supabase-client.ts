'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL_ENV = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY_ENV = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cached: SupabaseClient | null = null;

// Single shared Supabase client. Both the data adapter and the auth
// provider import this so we don't end up with two independent sessions.
export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!URL_ENV || !KEY_ENV) return null;
  if (!cached) {
    cached = createClient(URL_ENV, KEY_ENV, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return cached;
}

export function supabaseConfigured(): boolean {
  return Boolean(URL_ENV && KEY_ENV);
}
