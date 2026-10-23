import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import { Avatar } from '@/components/ui/Avatar';
import InvitationActions from '@/components/teams/InvitationActions';
import CreateTeamCard from '@/components/teams/CreateTeamCard';
import AllTeams, { type TeamRow } from './AllTeams';
import { getMyTeams, getMyInvitations, getMyRegistrations } from '@/lib/data/user';
import { splitTitle } from '@/lib/data/competitions';
import { PHASE_UI } from '@/lib/ui/phase';
import { timeAgo } from '@/lib/ui/dates';
import { cn } from '@/lib/utils/cn';

export const metadata = { title: 'Teams – The Noders Platform' };

const TINTS = ['bg-amber-bg', 'bg-violet-bg', 'bg-teal-bg', 'bg-blue-bg'];

export default async function TeamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/teams');

  const [mine, invitations, { data: allTeams }] = await Promise.all([
    getMyTeams(supabase, user.id),
    getMyInvitations(supabase, user.id),
    supabase.from('teams').select('id, name, description, leader_id, leader:users!teams_leader_id_fkey(full_name, email)').order('created_at', { ascending: false }) as unknown as Promise<{ data: any[] | null }>,
  ]);
  const regs = await getMyRegistrations(
    supabase,
    user.id,
    mine.map((t) => t.id)
  );

  const ids = (allTeams ?? []).map((t) => t.id);
  const { data: memberRows } = ids.length ? await supabase.from('team_members').select('team_id').in('team_id', ids) : { data: [] };
  const count: Record<string, number> = {};
  ((memberRows ?? []) as { team_id: string }[]).forEach((r) => (count[r.team_id] = (count[r.team_id] ?? 0) + 1));

  const mineIds = new Set(mine.map((t) => t.id));
  const one = (v: any) => (Array.isArray(v) ? v[0] : v);
  const rows: TeamRow[] = (allTeams ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    leader: one(t.leader)?.full_name || one(t.leader)?.email?.split('@')[0] || 'Unknown',
    members: count[t.id] ?? 0,
    mine: mineIds.has(t.id),
  }));

  const regsOf = (teamId: string) => regs.filter((r) => r.teamId === teamId && r.phase !== 'ended');

  return (
    <>
      <PageBand
        eyebrow="Your account"
        title="Teams"
        description="The leader registers the team; every member can submit, sharing one daily limit."
        aside={
          invitations.length > 0 ? (
            <div className="flex flex-col gap-3">
              {invitations.map((i) => (
                <div key={i.id} className="flex flex-col gap-2 rounded-2xl bg-amber-strong p-5 text-white shadow-lift sm:p-6">
                  <span className="text-[13px] font-semibold text-amber-soft">Invitation · {timeAgo(i.invitedAt)}</span>
                  <span className="text-lg font-bold leading-snug">
                    {i.inviter} invited you to {i.teamName}
                  </span>
                  <span className="text-sm text-amber-soft">
                    {i.memberCount} member{i.memberCount === 1 ? '' : 's'} now
                  </span>
                  <div className="mt-1.5">
                    <InvitationActions invitationId={i.id} teamName={i.teamName} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 rounded-2xl bg-navy-deep p-5 sm:p-6">
              <span className="text-sm text-navy-text">Invitations</span>
              <span className="text-lg font-semibold">None right now</span>
              <span className="text-sm text-navy-text">When a leader invites your email, it shows up here and on your dashboard.</span>
            </div>
          )
        }
      />

      <section data-reveal aria-labelledby="yours" className="shell pt-12 sm:pt-14">
        <h2 id="yours" className="h-section mb-5">
          Your teams
        </h2>
        <div data-reveal-group className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mine.map((t, idx) => {
            const active = regsOf(t.id);
            return (
              <Link key={t.id} href={`/teams/${t.id}`} className={cn('lift flex flex-col gap-4 rounded-[18px] p-6 text-text-primary', TINTS[idx % TINTS.length])}>
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-xl font-bold">{t.name}</span>
                    <span className="text-sm text-text-tertiary">{t.isLeader ? 'You lead this team' : 'You’re a member'}</span>
                  </span>
                  <span className="shrink-0 font-mono text-sm text-text-tertiary">
                    {t.members.length}
                    <span className="sr-only"> members</span>
                  </span>
                </span>
                <span className="flex -space-x-2" aria-label={t.members.map((m) => m.name).join(', ')}>
                  {t.members.slice(0, 6).map((m) => (
                    <Avatar key={m.userId} name={m.name} size={34} colorful className="ring-2 ring-bg-primary" />
                  ))}
                  {t.members.length > 6 && <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-bg-raised text-xs ring-2 ring-bg-primary">+{t.members.length - 6}</span>}
                </span>
                <span className="mt-auto text-sm text-text-secondary">
                  {active.length > 0 ? (
                    active.map((r) => (
                      <span key={r.competitionId} className="mr-3 inline-flex items-center gap-1.5">
                        <span className={cn('h-2 w-2 rounded-full', PHASE_UI[r.phase].fill)} aria-hidden />
                        {splitTitle(r.title).code ?? r.title}
                        <span className="text-text-muted">· {r.status === 'approved' ? PHASE_UI[r.phase].label : r.status === 'pending' ? 'pending' : 'not approved'}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-text-muted">Not in a contest right now</span>
                  )}
                </span>
              </Link>
            );
          })}
          <CreateTeamCard className={mine.length === 0 ? 'md:col-span-2 lg:col-span-1' : undefined} />
          {mine.length === 0 && (
            <div className="flex flex-col gap-3 rounded-[18px] bg-bg-surface p-6 text-[15px] text-text-secondary md:col-span-2 lg:col-span-2">
              <span className="text-[13px] font-semibold text-text-tertiary">How teams work</span>
              <ol className="flex flex-col gap-2">
                {['Create a team, or accept an invitation from a leader.', 'The leader registers the team for a team contest.', 'After approval, any member can submit. The daily limit is shared.'].map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-mono text-[13px] text-amber">{String(i + 1).padStart(2, '0')}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <span className="text-sm text-text-muted">One person can be in several teams, but only one team per contest.</span>
            </div>
          )}
        </div>
      </section>

      <section data-reveal aria-labelledby="all" className="shell pb-24 pt-16 sm:pb-28 sm:pt-20">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 id="all" className="h-section">
            All teams
          </h2>
          <span className="text-sm text-text-muted">{rows.length} on the platform. To join one, ask its leader for an invitation.</span>
        </div>
        <AllTeams teams={rows} />
      </section>
    </>
  );
}
