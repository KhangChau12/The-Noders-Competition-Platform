import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import { Countdown } from '@/components/ui/Countdown';
import { splitTitle } from '@/lib/data/competitions';
import { getCompetitionPhase } from '@/lib/utils/competition';
import { ACTIVE_REGISTRATION_STATUSES, metricShortName, metricArrow } from '@/lib/constants';
import { vnRange, shortCountdown } from '@/lib/ui/dates';
import RegisterForm, { type TeamOption } from './RegisterForm';

// Auth-dependent data must be fresh on every request.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data } = (await supabase.from('competitions').select('title').eq('id', params.id).maybeSingle()) as { data: { title: string; description?: string | null } | null };
  return {
    title: data ? `Register · ${data.title} – The Noders Platform` : 'The Noders Platform',
  };
}

export default async function RegisterPage({ params }: Props) {
  const { id } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/competitions/${id}/register`);

  const { data: competition } = (await supabase
    .from('competitions')
    .select('id, title, participation_type, min_team_size, max_team_size, registration_start, registration_end, public_test_start, public_test_end, private_test_end, scoring_metric, daily_submission_limit, competition_type')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()) as { data: any };
  if (!competition) redirect('/competitions');

  const phase = getCompetitionPhase(competition);
  if (phase === 'ended') redirect(`/competitions/${id}`);
  const isTeam = competition.participation_type === 'team';

  let teams: TeamOption[] = [];

  if (!isTeam) {
    const { data: existing } = await supabase.from('registrations').select('id').eq('competition_id', id).eq('user_id', user.id).maybeSingle();
    if (existing) redirect(`/competitions/${id}`);
  } else {
    const { data: memberships } = (await supabase.from('team_members').select('team_id, teams(id, name, leader_id)').eq('user_id', user.id)) as { data: any[] | null };
    const myTeams = (memberships ?? []).map((m) => (Array.isArray(m.teams) ? m.teams[0] : m.teams)).filter(Boolean) as { id: string; name: string; leader_id: string }[];
    const myTeamIds = myTeams.map((t) => t.id);

    // Already registered with one of my teams? Then there's nothing to do here.
    if (myTeamIds.length) {
      const { data: mine } = await supabase.from('registrations').select('id').eq('competition_id', id).in('team_id', myTeamIds).in('status', ACTIVE_REGISTRATION_STATUSES).limit(1);
      if (mine && mine.length) redirect(`/competitions/${id}`);
    }

    // Teams already registered for this contest, and who is in them.
    const { data: regTeams } = (await supabase.from('registrations').select('team_id, teams(name)').eq('competition_id', id).not('team_id', 'is', null).in('status', ACTIVE_REGISTRATION_STATUSES)) as {
      data: any[] | null;
    };
    const registeredTeamIds = (regTeams ?? []).map((r) => r.team_id as string);
    const teamNames = new Map((regTeams ?? []).map((r) => [r.team_id as string, (Array.isArray(r.teams) ? r.teams[0] : r.teams)?.name as string]));

    const allIds = Array.from(new Set([...myTeamIds, ...registeredTeamIds]));
    const { data: members } = allIds.length
      ? ((await supabase.from('team_members').select('team_id, user_id, users(full_name)').in('team_id', allIds)) as { data: any[] | null })
      : { data: [] as any[] };

    const membersOf = (tid: string) => (members ?? []).filter((m) => m.team_id === tid);
    const registeredBy = new Map<string, string>(); // user_id → registered team id
    for (const tid of registeredTeamIds) for (const m of membersOf(tid)) registeredBy.set(m.user_id, tid);

    const leaderName = (tid: string, leaderId: string) => {
      const m = membersOf(tid).find((x) => x.user_id === leaderId);
      return (Array.isArray(m?.users) ? m?.users[0] : m?.users)?.full_name ?? 'the leader';
    };

    teams = myTeams.map((t) => {
      const ms = membersOf(t.id);
      const size = ms.length;
      const isLeader = t.leader_id === user.id;
      const min = competition.min_team_size ?? 1;
      const max = competition.max_team_size ?? 99;
      const conflictMember = ms.find((m) => registeredBy.has(m.user_id) && registeredBy.get(m.user_id) !== t.id);
      const conflictTeam = conflictMember ? teamNames.get(registeredBy.get(conflictMember.user_id)!) : null;
      const checks = [
        isLeader ? { ok: true, text: 'You are the leader' } : { ok: false, text: `Only ${leaderName(t.id, t.leader_id)}, the leader, can register this team` },
        size >= min && size <= max
          ? { ok: true, text: `${size} member${size > 1 ? 's' : ''}, within ${min}–${competition.max_team_size ?? '∞'}` }
          : { ok: false, text: `${size} member${size > 1 ? 's' : ''}; this contest needs ${min}–${competition.max_team_size ?? '∞'}` },
        conflictMember
          ? { ok: false, text: `A member is already in “${conflictTeam ?? 'another team'}” for this contest` }
          : { ok: true, text: 'No member is in another registered team' },
      ];
      return { id: t.id, name: t.name, size, isLeader, eligible: checks.every((c) => c.ok), checks };
    });
  }

  const { code, name } = splitTitle(competition.title);
  const late = phase !== 'registration' && phase !== 'upcoming';

  return (
    <>
      <PageBand
        crumbs={[{ label: 'Competitions', href: '/competitions' }, { label: code ?? name, href: `/competitions/${id}` }, { label: 'Register' }]}
        title={`Register for ${code ?? name}`}
        description={
          isTeam
            ? `Teams of ${competition.min_team_size ?? 1}–${competition.max_team_size ?? 3}. Only the leader can register, and each person may join one team per contest.`
            : 'Individual contest. Registrations are approved by an organiser.'
        }
        aside={
          <div className="rounded-2xl bg-violet-strong p-5 sm:p-6">
            <p className="text-sm text-violet-soft">{phase === 'upcoming' ? 'Registration opens in' : late ? 'Late registration' : 'Registration closes in'}</p>
            {!late ? (
              <Countdown
                target={phase === 'upcoming' ? competition.registration_start : competition.registration_end}
                initial={shortCountdown(phase === 'upcoming' ? competition.registration_start : competition.registration_end) ?? undefined}
                className="mt-1 block text-[2rem] leading-tight"
              />
            ) : (
              <p className="mt-1 text-lg font-semibold">The contest has started; you can still join.</p>
            )}
          </div>
        }
      />
      <div className="shell pb-24 pt-12 sm:pt-14">
        <RegisterForm
          competitionId={id}
          isTeam={isTeam}
          teams={teams}
          minTeamSize={competition.min_team_size}
          maxTeamSize={competition.max_team_size}
          summary={{
            format: isTeam ? `Teams of ${competition.min_team_size ?? 1}–${competition.max_team_size ?? 3}` : 'Individual',
            metric: `${metricShortName(competition.scoring_metric)} ${metricArrow(competition.scoring_metric)}`,
            perDay: `${competition.daily_submission_limit} submissions`,
            publicTest: vnRange(competition.public_test_start, competition.public_test_end),
          }}
        />
      </div>
    </>
  );
}
