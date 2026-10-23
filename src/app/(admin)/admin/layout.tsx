import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Auth/role data must be fresh on every request.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Admin shell. Performs the auth + role check once for the whole /admin/* area.
 * Navigation lives in the site header, which switches to its admin variant on
 * /admin paths; each page renders its own navy band and content.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = (await supabase.from('users').select('role').eq('id', user.id).single()) as {
    data: { role: string } | null;
  };

  if (profile?.role !== 'admin') redirect('/dashboard');

  return <div className="pb-24">{children}</div>;
}
