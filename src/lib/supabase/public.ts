import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

/**
 * Cookie-less, anonymous Supabase client for PUBLIC data only (contests,
 * leaderboards, practice stats). It reads exactly what a signed-out visitor
 * can read under RLS, so its results are safe to cache and share between
 * users. Never use it for anything user-specific.
 */
export function createPublicClient(): SupabaseClient {
  if (!client) {
    client = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}
