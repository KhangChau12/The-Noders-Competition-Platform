import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/admin/AdminSidebar';

// Auth/role data must be fresh on every request.
export const dynamic = 'force-dynamic';

/**
 * Admin shell. Performs the auth + role check once for the whole /admin/* area
 * (individual pages no longer need to repeat it) and renders the persistent
 * sidebar alongside the page content.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: { role: string } | null };

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Pending registrations count powers the sidebar badge.
  const { count: pendingCount } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  return (
    <div className="lg:flex">
      <AdminSidebar pendingCount={pendingCount ?? 0} />
      <main className="flex-1 min-w-0 px-4 py-6 sm:py-8 lg:px-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
