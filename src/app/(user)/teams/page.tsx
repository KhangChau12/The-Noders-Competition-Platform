import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import { Avatar } from '@/components/ui/Avatar';
import InvitationActions from '@/components/teams/InvitationActions';
import CreateTeamCard from '@/components/teams/CreateTeamCard';
import TeamCard from '@/components/teams/TeamCard';
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          {mine.length > 0 ? (
            <div data-reveal-group className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
              {mine.map((t, idx) => (
                <TeamCard key={t.id} team={t} tint={TINTS[idx % TINTS.length]} contests={regsOf(t.id)} />
              ))}
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-[18px] bg-bg-surface p-6 sm:p-7">
              <span className="h-card">You’re not in a team yet</span>
              <p className="text-[15px] text-text-secondary">Create one on the right, or ask a team leader to invite the email you signed up with. Invitations appear at the top of this page.</p>
            </div>
          )}

          <aside className="flex w-full flex-col gap-4 lg:w-[340px] lg:shrink-0">
            <CreateTeamCard collapsible={mine.length > 0} />
            <div className="flex flex-col gap-3 rounded-[18px] bg-bg-surface p-6 text-[15px] text-text-secondary">
              <span className="text-[13px] font-semibold text-text-tertiary">How teams work</span>
              <ol className="flex flex-col gap-2.5">
                {['The leader registers the team for a team contest.', 'After approval, any member can submit.', 'Members share one daily submission limit.'].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-mono text-[13px] leading-6 text-amber">{String(i + 1).padStart(2, '0')}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <span className="text-sm text-text-muted">You can be in several teams, but only one team per contest.</span>
            </div>
          </aside>
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
