import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageBand, BandFacts } from '@/components/ui/PageBand';
import { Avatar } from '@/components/ui/Avatar';
import ProfileForm from './ProfileForm';
import { getMyTeams, getMyRegistrations } from '@/lib/data/user';
import { vnDate } from '@/lib/ui/dates';

export const metadata = { title: 'Profile – The Noders Platform' };

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/profile');

  const [{ data: profile }, teams, { count: subs }, { count: practiced }] = await Promise.all([
    supabase.from('users').select('full_name, bio, role, created_at').eq('id', user.id).maybeSingle() as unknown as Promise<{ data: { full_name: string | null; bio: string | null; role: string; created_at: string } | null }>,
    getMyTeams(supabase, user.id),
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('submitted_by', user.id),
    supabase.from('practice_submissions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('validation_status', 'valid').eq('is_best_score', true),
  ]);
  const regs = await getMyRegistrations(
    supabase,
    user.id,
    teams.map((t) => t.id)
  );

  const name = profile?.full_name ?? '';
  const first = teams[0];

  return (
    <>
      <PageBand
        eyebrow="Profile"
        title={
          <span className="flex items-center gap-4 sm:gap-5">
            <Avatar name={name || user.email} size={64} colorful className="hidden sm:inline-flex" />
            <span className="min-w-0">{name || 'Your profile'}</span>
          </span>
        }
        description={profile?.role === 'admin' ? 'Organiser account. You can open the admin panel from the menu.' : 'Your public name and bio.'}
      >
        <BandFacts
          facts={[
            { value: regs.filter((r) => r.status === 'approved').length, label: 'Contests entered' },
            { value: subs ?? 0, label: 'Contest submissions' },
            { value: practiced ?? 0, label: 'Practice problems scored', color: 'text-teal' },
            { value: teams.length, label: teams.length === 1 ? 'Team' : 'Teams', color: 'text-amber' },
          ]}
        />
      </PageBand>

      <div className="shell flex flex-col gap-10 pb-24 pt-12 sm:pb-28 sm:pt-14">
        <ProfileForm name={name} bio={profile?.bio ?? ''} teamName={first?.name ?? null} teamSize={first?.members.length ?? 0} />

        <section data-reveal aria-labelledby="signin" className="flex flex-col gap-4 rounded-[18px] bg-bg-elevated p-6 sm:p-8 lg:max-w-[calc(100%-420px)]">
          <h2 id="signin" className="h-card">
            Sign-in
          </h2>
          <dl className="grid grid-cols-1 gap-4 text-[15px] sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-sm text-text-muted">Email</dt>
              <dd className="truncate font-mono">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-text-muted">Member since</dt>
              <dd>{profile?.created_at ? vnDate(profile.created_at) : '—'}</dd>
            </div>
          </dl>
          <p className="text-sm text-text-tertiary">
            Your email can’t be changed here. Team invitations are sent to it.{' '}
            <Link href="/reset-password" className="link">
              Change password
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
