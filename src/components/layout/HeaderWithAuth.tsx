import { createClient } from '@/lib/supabase/server';
import Header, { type HeaderUser } from './Header';

export default async function HeaderWithAuth() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return <Header user={null} invitations={0} adminPending={0} />;

  const { data: profile, error } = (await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, role')
    .eq('id', authUser.id)
    .maybeSingle()) as {
    data: { id: string; email: string; full_name: string | null; avatar_url: string | null; role: string } | null;
    error: unknown;
  };

  if (!profile && !error) {
    // Profile row missing (user created before the trigger existed): create it once.
    await (supabase.from('users') as any).insert({
      id: authUser.id,
      email: authUser.email!,
      role: 'user',
      full_name: authUser.user_metadata?.full_name || null,
      avatar_url: authUser.user_metadata?.avatar_url || null,
    });
  }

  const user: HeaderUser = {
    id: authUser.id,
    email: profile?.email ?? authUser.email ?? '',
    full_name: profile?.full_name ?? authUser.user_metadata?.full_name ?? undefined,
    avatar_url: profile?.avatar_url ?? undefined,
    role: profile?.role === 'admin' ? 'admin' : 'user',
  };

  // Things waiting for this person: drive the amber dot and the admin badge.
  const [{ count: invitations }, adminRes] = await Promise.all([
    supabase
      .from('team_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
      .eq('status', 'pending'),
    user.role === 'admin'
      ? supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      : Promise.resolve({ count: 0 }),
  ]);

  return <Header user={user} invitations={invitations ?? 0} adminPending={adminRes.count ?? 0} />;
}
