import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import { Avatar } from '@/components/ui/Avatar';
import { InviteCard, CancelInvite, RemoveMember, TeamDetailsForm, DeleteTeamCard } from './TeamManagement';
import { getCompetitionPhase } from '@/lib/utils/competition';
import { splitTitle } from '@/lib/data/competitions';
import { PHASE_UI } from '@/lib/ui/phase';
import { vnDate, timeAgo } from '@/lib/ui/dates';
import { cn } from '@/lib/utils/cn';

const one = (v: any) => (Array.isArray(v) ? v[0] ?? null : v ?? null);
const nameOf = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'Member';

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/teams/${params.id}`);

  const [{ data: team }, { data: members }, { data: invites }, { data: regs }] = (await Promise.all([
    supabase.from('teams').select('id, name, description, leader_id, created_at').eq('id', params.id).maybeSingle(),
    supabase.from('team_members').select('user_id, joined_at, users(full_name, email, bio)').eq('team_id', params.id).order('joined_at', { ascending: true }),
    supabase.from('team_invitations').select('id, invited_at, users!team_invitations_user_id_fkey(full_name, email)').eq('team_id', params.id).eq('status', 'pending').order('invited_at', { ascending: false }),
    supabase
      .from('registrations')
      .select('id, status, competition_id, competitions(title, deleted_at, max_team_size, registration_start, registration_end, public_test_start, public_test_end, private_test_start, private_test_end)')
      .eq('team_id', params.id),
  ])) as [{ data: any }, { data: any[] | null }, { data: any[] | null }, { data: any[] | null }];

  if (!team) notFound();

  const isLeader = team.leader_id === user.id;
  const isMember = (members ?? []).some((m) => m.user_id === user.id);
  const sorted = [...(members ?? [])].sort((a, b) => (a.user_id === team.leader_id ? -1 : b.user_id === team.leader_id ? 1 : 0));
  const leaderName = nameOf(one(sorted.find((m) => m.user_id === team.leader_id)?.users));

  const now = new Date();
  const contests = (regs ?? [])
    .map((r) => ({ ...r, c: one(r.competitions) }))
    .filter((r) => r.c && !r.c.deleted_at)
    .map((r) => ({ id: r.competition_id as string, status: r.status as string, title: r.c.title as string, max: r.c.max_team_size as number | null, phase: getCompetitionPhase(r.c, now) }));
  const activeRegs = contests.filter((c) => c.status === 'approved' || c.status === 'pending');
  const sizeCap = activeRegs.map((c) => c.max).filter((m): m is number => !!m);
  const full = sizeCap.length > 0 && sorted.length >= Math.min(...sizeCap);

  const role = isLeader
    ? { bg: 'bg-blue-strong', soft: 'text-blue-soft', label: 'You lead this team', text: 'You register it for contests, invite and remove members, and edit its details.' }
    : isMember
      ? { bg: 'bg-teal-strong', soft: 'text-teal-soft', label: 'You’re a member', text: `You can submit for the team in its contests. ${leaderName} handles registration and members.` }
      : { bg: 'bg-violet-strong', soft: 'text-violet-soft', label: 'You’re not in this team', text: `To join, ask ${leaderName} to invite ${user.email ?? 'your email'}.` };

  return (
    <>
      <PageBand
        crumbs={[{ label: 'Teams', href: '/teams' }, { label: team.name }]}
        title={team.name}
        description={
          <>
            {team.description && <p className="mb-2">{team.description}</p>}
            <p className="text-[15px] text-[#9FB1D6]">
              {sorted.length} member{sorted.length === 1 ? '' : 's'} · led by {leaderName} · since {vnDate(team.created_at)}
            </p>
          </>
        }
        aside={
          <div className={cn('flex flex-col gap-2 rounded-2xl p-5 text-white shadow-lift sm:p-6', role.bg)}>
            <span className={cn('text-[13px] font-semibold', role.soft)}>Your role</span>
            <span className="text-xl font-bold">{role.label}</span>
            <span className={cn('text-[15px]', role.soft)}>{role.text}</span>
          </div>
        }
      />

      <div className="shell pb-24 pt-12 sm:pb-28 sm:pt-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          <div className="flex min-w-0 flex-1 flex-col gap-10">
            <section data-reveal aria-labelledby="members">
              <h2 id="members" className="h-section mb-5">
                Members <span className="font-mono text-lg font-normal text-text-muted">{sorted.length}</span>
              </h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {sorted.map((m) => {
                  const u = one(m.users);
                  const name = nameOf(u);
                  const lead = m.user_id === team.leader_id;
                  return (
                    <li key={m.user_id} className={cn('flex flex-col gap-3 rounded-2xl p-5', lead ? 'bg-amber-bg' : 'bg-bg-surface')}>
                      <span className="flex items-center gap-3.5">
                        <Avatar name={name} size={44} colorful />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">
                            {name}
                            {m.user_id === user.id && <span className="font-normal text-text-muted"> (you)</span>}
                          </span>
                          <span className={cn('block text-sm', lead ? 'text-amber' : 'text-text-muted')}>{lead ? 'Leader' : `Joined ${vnDate(m.joined_at)}`}</span>
                        </span>
                      </span>
                      {u?.bio && <p className="line-clamp-2 text-sm text-text-tertiary">{u.bio}</p>}
                      {(isLeader || isMember) && u?.email && <span className="truncate font-mono text-[13px] text-text-muted">{u.email}</span>}
                      {isLeader && !lead && <RemoveMember teamId={team.id} userId={m.user_id} name={name} />}
                    </li>
                  );
                })}
              </ul>
            </section>

            {isLeader && (
              <section data-reveal aria-label="Invitations" className="flex flex-col gap-4">
                <InviteCard teamId={team.id} full={full} />
                {(invites ?? []).length > 0 && (
                  <div className="rounded-[18px] bg-amber-bg p-6">
                    <h3 className="mb-3 text-[13px] font-semibold text-amber">Waiting for an answer · {(invites ?? []).length}</h3>
                    <ul className="flex flex-col">
                      {(invites ?? []).map((i) => {
                        const u = one(i.users);
                        return (
                          <li key={i.id} className="flex items-center gap-3.5 border-t border-white/[0.06] py-3 first:border-t-0 first:pt-0 last:pb-0">
                            <Avatar name={nameOf(u)} size={36} colorful />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold">{nameOf(u)}</span>
                              <span className="block truncate text-sm text-amber-muted">
                                {u?.email} · {timeAgo(i.invited_at)}
                              </span>
                            </span>
                            <CancelInvite invitationId={i.id} />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="flex w-full flex-col gap-4 lg:w-[380px] lg:shrink-0">
            <div className="flex flex-col gap-3 rounded-[18px] bg-violet-bg p-6">
              <h2 className="h-card">Contests</h2>
              {contests.length === 0 ? (
                <p className="text-[15px] text-violet-muted">
                  Not registered for any contest yet.{' '}
                  {isLeader && (
                    <Link href="/competitions" className="font-semibold text-violet hover:underline">
                      Find a team contest →
                    </Link>
                  )}
                </p>
              ) : (
                <ul className="flex flex-col">
                  {contests.map((c) => (
                    <li key={c.id} className="border-t border-white/[0.06] first:border-t-0">
                      <Link href={`/competitions/${c.id}`} className="flex items-center gap-3 py-3 text-text-primary hover:text-white">
                        <span className={cn('h-2 w-2 shrink-0 rounded-full', PHASE_UI[c.phase].fill)} aria-hidden />
                        <span className="min-w-0 flex-1 truncate font-semibold">{splitTitle(c.title).code ?? c.title}</span>
                        <span className="shrink-0 text-sm text-violet-muted">{c.status === 'approved' ? PHASE_UI[c.phase].label : c.status === 'pending' ? 'Pending' : 'Not approved'}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {isLeader && <TeamDetailsForm teamId={team.id} name={team.name} description={team.description} />}
            {isLeader && <DeleteTeamCard teamId={team.id} teamName={team.name} blocked={activeRegs.length > 0} />}
          </aside>
        </div>
      </div>
    </>
  );
}
