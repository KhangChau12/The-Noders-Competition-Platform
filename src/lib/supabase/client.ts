import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (client) return client;
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        lock: async (name, _acquireTimeout, fn) => {
          if (typeof navigator !== 'undefined' && navigator?.locks) {
            try {
              return await navigator.locks.request(name, fn);
            } catch {
              return await fn();
            }
          }
          return await fn();
        },
      },
    }
  );
  return client;
}
