import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Trophy, BookOpen, Users as UsersIcon, ArrowRight, Clock, Medal, Activity } from 'lucide-react';
import TeamsSidebar from './TeamsSidebar';
import PracticeProblemCard from '@/components/practice/PracticeProblemCard';
import { SCORING_METRIC_INFO } from '@/lib/constants';

type CompetitionPhase = 'upcoming' | 'registration' | 'public_test' | 'private_test' | 'ended';

type Competition = {
  id: string;
  title: string;
  description: string;
  competition_type: '3-phase' | '4-phase';
  participation_type: 'individual' | 'team';
  registration_start: string;
  registration_end: string;
  public_test_start: string;
  public_test_end: string;
  private_test_start: string | null;
  private_test_end: string | null;
  scoring_metric: string;
};

type CompetitionWithStats = Competition & {
  phase: CompetitionPhase;
  participant_count: number;
  registration_status?: 'not_registered' | 'pending' | 'approved' | 'rejected';
  countdown?: {
    days: number;
    hours: number;
    minutes: number;
    label: string;
  };
};

// Helper function to determine competition phase
function getCompetitionPhase(comp: Competition, now: Date): CompetitionPhase {
  const regStart = new Date(comp.registration_start);
  const regEnd = new Date(comp.registration_end);
  const publicStart = new Date(comp.public_test_start);
  const publicEnd = new Date(comp.public_test_end);
  const privateStart = comp.private_test_start ? new Date(comp.private_test_start) : null;
  const privateEnd = comp.private_test_end ? new Date(comp.private_test_end) : null;

  if (now < regStart) return 'upcoming';
  if (now >= regStart && now <= regEnd) return 'registration';
  if (now > regEnd && now <= publicEnd) return 'public_test';
  if (privateStart && privateEnd && now > publicEnd && now <= privateEnd) return 'private_test';
  return 'ended';
}

// Helper function to get countdown
function getCountdown(
  comp: Competition,
  phase: CompetitionPhase,
  now: Date
): { days: number; hours: number; minutes: number; label: string } | undefined {
  if (phase === 'ended') return undefined;

  let targetDate: Date;
  let label: string;

  if (phase === 'upcoming') {
    targetDate = new Date(comp.registration_start);
    label = 'Registration starts in';
  } else if (phase === 'registration') {
    targetDate = new Date(comp.registration_end);
    label = 'Registration ends in';
  } else if (phase === 'public_test') {
    targetDate = new Date(comp.public_test_end);
    label = 'Public test ends in';
  } else if (phase === 'private_test' && comp.private_test_end) {
    targetDate = new Date(comp.private_test_end);
    label = 'Private test ends in';
  } else {
    return undefined;
  }

  const diff = targetDate.getTime() - now.getTime();
  if (diff < 0) return undefined;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, label };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile for personalized greeting
  const { data: profile } = (await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()) as { data: any };
  const firstName = profile?.full_name?.trim().split(/\s+/).pop() ?? null;

  // Fetch user's individual registrations
  const { data: individualRegistrations } = await supabase
    .from('registrations')
    .select(`
      id,
      competition_id,
      status,
      registered_at,
      competitions!inner (
        id,
        title,
        description,
        competition_type,
        participation_type,
        registration_start,
        registration_end,
        public_test_start,
        public_test_end,
        private_test_start,
        private_test_end,
        scoring_metric
      )
    `)
    .eq('user_id', user.id)
    .order('registered_at', { ascending: false });

  // Fetch user's team memberships first
  const { data: userTeamMemberships } = (await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)) as { data: any };

  // Fetch team registrations if user is in any teams
  let teamRegistrations: any[] = [];
  if (userTeamMemberships && userTeamMemberships.length > 0) {
    const teamIds = userTeamMemberships.map((m: any) => m.team_id);

    const { data: teamRegs } = await supabase
      .from('registrations')
      .select(`
        id,
        competition_id,
        status,
        registered_at,
        team_id,
        competitions!inner (
          id,
          title,
          description,
          competition_type,
          participation_type,
          registration_start,
          registration_end,
          public_test_start,
          public_test_end,
          private_test_start,
          private_test_end,
          scoring_metric
        )
      `)
      .in('team_id', teamIds)
      .order('registered_at', { ascending: false });

    teamRegistrations = teamRegs || [];
  }

  // Combine individual and team registrations
  const registrations = [...(individualRegistrations || []), ...teamRegistrations];

  // Fetch ALL active competitions
  const { data: allCompetitions } = (await supabase
    .from('competitions')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })) as { data: any };

  // Create map of competition_id -> registration status
  const registrationStatusMap = new Map(
    registrations?.map((r: any) => [r.competition_id, r.status]) || []
  );

  const now = new Date();

  // Fetch participant counts
  const { data: participantCountsData } = await supabase
    .from('competition_participant_counts')
    .select('competition_id, participant_count');

  const participantCounts = (participantCountsData || []).reduce(
    (acc, item: any) => {
      acc[item.competition_id] = item.participant_count;
      return acc;
    },
    {} as Record<string, number>
  );

  // Process ALL competitions
  const processAllCompetitions = (comps: any[]): CompetitionWithStats[] => {
    return comps.map((comp: Competition) => {
      const phase = getCompetitionPhase(comp, now);
      const countdown = getCountdown(comp, phase, now);
      const regStatus = registrationStatusMap.get(comp.id);
      const registration_status: 'not_registered' | 'pending' | 'approved' | 'rejected' =
        regStatus || 'not_registered';

      return {
        ...comp,
        phase,
        participant_count: participantCounts[comp.id] || 0,
        registration_status,
        countdown,
      };
    });
  };

  const processedAllCompetitions = allCompetitions
    ? processAllCompetitions(allCompetitions)
    : [];

  // Compute the user's leaderboard rank in each registered competition
  const myTeamIdSet = new Set<string>(
    (userTeamMemberships ?? []).map((m: any) => m.team_id)
  );
  const myCompIds = registrations.map((r: any) => r.competition_id);
  const compRanks: Record<string, { rank: number; total: number }> = {};
  if (myCompIds.length > 0) {
    const { data: bestSubs } = await (supabase as any)
      .from('submissions')
      .select('competition_id, score, phase, user_id, team_id')
      .in('competition_id', myCompIds)
      .eq('is_best_score', true)
      .eq('validation_status', 'valid')
      .not('score', 'is', null);

    const subsByComp: Record<string, any[]> = {};
    (bestSubs ?? []).forEach((s: any) => {
      (subsByComp[s.competition_id] ??= []).push(s);
    });

    processedAllCompetitions.forEach((comp) => {
      const rows = subsByComp[comp.id];
      if (!rows || rows.length === 0) return;
      // Rank against the leaderboard of the most relevant phase
      const privateRows = rows.filter((r) => r.phase === 'private');
      const pool =
        (comp.phase === 'private_test' || comp.phase === 'ended') && privateRows.length > 0
          ? privateRows
          : rows.filter((r) => r.phase === 'public');
      if (pool.length === 0) return;
      const higherIsBetter =
        SCORING_METRIC_INFO[comp.scoring_metric as keyof typeof SCORING_METRIC_INFO]
          ?.higher_is_better !== false;
      pool.sort((a, b) => (higherIsBetter ? b.score - a.score : a.score - b.score));
      const idx = pool.findIndex(
        (s) => s.user_id === user.id || (s.team_id && myTeamIdSet.has(s.team_id))
      );
      if (idx >= 0) compRanks[comp.id] = { rank: idx + 1, total: pool.length };
    });
  }

  // Recent competition submissions by this user (for the activity feed)
  const { data: recentCompSubs } = await (supabase as any)
    .from('submissions')
    .select('id, score, submitted_at, validation_status, competition_id, competitions(title, scoring_metric)')
    .eq('submitted_by', user.id)
    .order('submitted_at', { ascending: false })
    .limit(5);

  // Fetch user's teams
  const { data: teamMemberships } = (await supabase
    .from('team_members')
    .select(`
      *,
      teams (
        id,
        name,
        leader_id
      )
    `)
    .eq('user_id', user.id)) as { data: any };

  let userTeams: any[] = [];
  if (teamMemberships && teamMemberships.length > 0) {
    const teamIds = teamMemberships.map((m: any) => m.teams.id);

    const { data: memberCounts } = (await supabase
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds)) as { data: any };

    const countMap = new Map<string, number>();
    if (memberCounts) {
      memberCounts.forEach((row: any) => {
        countMap.set(row.team_id, (countMap.get(row.team_id) || 0) + 1);
      });
    }

    userTeams = teamMemberships.map((membership: any) => ({
      id: membership.teams.id,
      name: membership.teams.name,
      member_count: countMap.get(membership.teams.id) || 0,
      is_leader: membership.teams.leader_id === user.id,
    }));
  }

  // Fetch pending team invitations
  const { data: invitations } = (await supabase
    .from('team_invitations')
    .select(`
      *,
      teams (
        id,
        name
      ),
      invited_by_user:users!team_invitations_invited_by_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('invited_at', { ascending: false })) as { data: any };

  // Fetch the user's practice activity (attempted problems + best scores)
  const { data: myPracticeSubs } = await (supabase as any)
    .from('practice_submissions')
    .select('problem_id, score, is_best_score, validation_status, submitted_at')
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false });

  const practiceBestScores: Record<string, number> = {};
  const attemptedInOrder: string[] = [];
  (myPracticeSubs ?? []).forEach((s: any) => {
    if (s.is_best_score && s.score !== null) practiceBestScores[s.problem_id] = s.score;
    if (!attemptedInOrder.includes(s.problem_id)) attemptedInOrder.push(s.problem_id);
  });

  // Fetch practice problems with tags
  const { data: rawPracticeProblems } = await (supabase as any)
    .from('practice_problems')
    .select('*, practice_problem_tags(tag_id, practice_tags(id, name, slug))')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const { data: practiceCounts } = await (supabase as any)
    .from('practice_problem_submission_counts')
    .select('problem_id, participant_count');

  const practiceCountMap: Record<string, number> = {};
  practiceCounts?.forEach((c: any) => { practiceCountMap[c.problem_id] = c.participant_count; });

  const allPracticeProblems = (rawPracticeProblems ?? []).map((p: any) => ({
    ...p,
    tags: (p.practice_problem_tags ?? []).map((pt: any) => pt.practice_tags).filter(Boolean),
    participant_count: practiceCountMap[p.id] ?? 0,
  }));

  // "Continue practicing": up to 2 most recently attempted, then fill with newest unattempted (4 total)
  const problemById = new Map<string, any>(allPracticeProblems.map((p: any) => [p.id, p]));
  const continueProblems = attemptedInOrder
    .map((id) => problemById.get(id))
    .filter(Boolean)
    .slice(0, 2);
  const freshProblems = allPracticeProblems.filter(
    (p: any) => !attemptedInOrder.includes(p.id)
  );
  const practiceProblems = [
    ...continueProblems,
    ...freshProblems.slice(0, 4 - continueProblems.length),
  ];
  const hasPracticed = attemptedInOrder.length > 0;

  // Recent activity feed: latest submissions across competitions + practice
  type ActivityItem = {
    id: string;
    title: string;
    href: string;
    kind: 'Competition' | 'Practice';
    score: number | null;
    validation_status: string;
    decimals: number;
    submitted_at: string;
  };
  const activityItems: ActivityItem[] = [
    ...((recentCompSubs ?? []).map((s: any) => {
      const comp = Array.isArray(s.competitions) ? s.competitions[0] : s.competitions;
      return {
        id: s.id,
        title: comp?.title ?? 'Competition',
        href: `/competitions/${s.competition_id}`,
        kind: 'Competition' as const,
        score: s.score,
        validation_status: s.validation_status,
        decimals:
          SCORING_METRIC_INFO[comp?.scoring_metric as keyof typeof SCORING_METRIC_INFO]
            ?.decimals ?? 4,
        submitted_at: s.submitted_at,
      };
    })),
    ...((myPracticeSubs ?? []).slice(0, 5).map((s: any) => {
      const problem = problemById.get(s.problem_id);
      return {
        id: `practice-${s.problem_id}-${s.submitted_at}`,
        title: problem?.title ?? 'Practice problem',
        href: `/practice/${s.problem_id}`,
        kind: 'Practice' as const,
        score: s.score,
        validation_status: s.validation_status,
        decimals:
          SCORING_METRIC_INFO[problem?.scoring_metric as keyof typeof SCORING_METRIC_INFO]
            ?.decimals ?? 4,
        submitted_at: s.submitted_at,
      };
    })),
  ]
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 6);

  // Split competitions into "yours" vs "open to join"
  const myCompetitions = processedAllCompetitions.filter(
    (c) => c.registration_status && c.registration_status !== 'not_registered'
  );
  const openCompetitions = processedAllCompetitions.filter(
    (c) =>
      (c.phase === 'registration' || c.phase === 'upcoming') &&
      (!c.registration_status || c.registration_status === 'not_registered')
  ).slice(0, 3);

  const activeCount = myCompetitions.filter(
    (c) => c.registration_status === 'approved' && c.phase !== 'ended'
  ).length;

  // Nearest deadline among approved, still-running competitions
  const nextDeadline = myCompetitions
    .filter((c) => c.registration_status === 'approved' && c.countdown)
    .sort((a, b) => {
      const aMin = a.countdown!.days * 1440 + a.countdown!.hours * 60 + a.countdown!.minutes;
      const bMin = b.countdown!.days * 1440 + b.countdown!.hours * 60 + b.countdown!.minutes;
      return aMin - bMin;
    })[0] ?? null;

  // Best leaderboard rank across registered competitions
  const rankValues = Object.values(compRanks).map((r) => r.rank);
  const bestCompRank = rankValues.length > 0 ? Math.min(...rankValues) : null;

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-brand text-3xl sm:text-4xl md:text-5xl mb-1.5 sm:mb-2 gradient-text leading-tight">Dashboard</h1>
          <p className="text-sm sm:text-lg text-text-secondary">
            Welcome back{firstName ? `, ${firstName}` : ''}! Here&apos;s what&apos;s happening.
          </p>
        </div>

        {/* Next deadline callout */}
        {nextDeadline && (
          <Link href={`/competitions/${nextDeadline.id}`} className="group block mb-8">
            <Card className="relative overflow-hidden p-4 sm:p-5 ring-1 ring-accent-cyan/30 hover:ring-accent-cyan/60 hover:-translate-y-0.5">
              <Clock className="absolute -bottom-5 -right-4 h-20 w-20 text-accent-cyan/[0.08] rotate-[-10deg] pointer-events-none select-none [filter:drop-shadow(0_0_18px_rgba(6,182,212,0.3))]" />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-cyan mb-1">
                    Next deadline · {nextDeadline.countdown!.label.replace(' in', '')}
                  </p>
                  <p className="font-bold text-text-primary truncate group-hover:text-primary-blue transition-colors">
                    {nextDeadline.title}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-4 shrink-0">
                  <span className="font-mono text-xl sm:text-2xl font-bold text-text-primary">
                    {nextDeadline.countdown!.days}
                    <span className="text-sm text-text-tertiary mr-2">d</span>
                    {nextDeadline.countdown!.hours}
                    <span className="text-sm text-text-tertiary mr-2">h</span>
                    {nextDeadline.countdown!.minutes}
                    <span className="text-sm text-text-tertiary">m</span>
                  </span>
                  <ArrowRight className="w-5 h-5 text-primary-blue group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {[
            {
              Icon: Trophy,
              value: String(activeCount),
              label: 'Active Competitions',
              accent: 'text-primary-blue/15',
            },
            {
              Icon: Medal,
              value: bestCompRank ? `#${bestCompRank}` : '—',
              label: 'Best Rank',
              accent: 'text-warning/15',
            },
            {
              Icon: UsersIcon,
              value: String(userTeams.length),
              label: 'Teams',
              accent: 'text-accent-cyan/15',
            },
            {
              Icon: BookOpen,
              value: String(attemptedInOrder.length),
              label: 'Practice Problems',
              accent: 'text-success/15',
            },
          ].map(({ Icon, value, label, accent }) => (
            <Card key={label} className="relative overflow-hidden p-3.5 sm:p-5">
              <Icon className={`absolute -bottom-3 -right-3 h-12 w-12 sm:h-16 sm:w-16 ${accent} rotate-[-8deg] pointer-events-none`} />
              <p className="relative text-2xl sm:text-3xl font-bold font-mono mb-0.5 sm:mb-1">{value}</p>
              <p className="relative text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-tertiary">{label}</p>
            </Card>
          ))}
        </div>

        {/* 2-Column Layout */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
          {/* LEFT COLUMN */}
          <div className="space-y-8 sm:space-y-12">
            {/* Your Competitions */}
            <section>
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="text-xl sm:text-2xl font-bold">Your Competitions</h2>
                <Link
                  href="/competitions"
                  className="text-sm font-semibold text-primary-blue hover:text-accent-cyan transition-colors shrink-0"
                >
                  Browse all &rarr;
                </Link>
              </div>

              {myCompetitions.length > 0 ? (
                <div className="space-y-4">
                  {myCompetitions.map((competition) => {
                    const now = new Date();
                    const regStart = new Date(competition.registration_start);
                    const publicEnd = new Date(competition.public_test_end);
                    const privateEnd = competition.private_test_end ? new Date(competition.private_test_end) : null;

                    const totalDuration = (privateEnd || publicEnd).getTime() - regStart.getTime();
                    const elapsed = now.getTime() - regStart.getTime();
                    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

                    const metricInfo =
                      SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];

                    return (
                      <Link key={competition.id} href={`/competitions/${competition.id}`} className="group block">
                        <Card className="p-4 sm:p-6 hover:border-primary-blue/50 transition-all cursor-pointer">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge
                              variant={
                                competition.phase === 'registration' ? 'purple' :
                                competition.phase === 'public_test' ? 'blue' :
                                competition.phase === 'private_test' ? 'cyan' : 'gray'
                              }
                            >
                              {competition.phase === 'registration' ? 'Registration' :
                               competition.phase === 'public_test' ? 'Public Test' :
                               competition.phase === 'private_test' ? 'Private Test' :
                               competition.phase === 'upcoming' ? 'Upcoming' : 'Ended'}
                            </Badge>
                            <Badge
                              variant={
                                competition.registration_status === 'approved' ? 'green' :
                                competition.registration_status === 'pending' ? 'yellow' : 'red'
                              }
                            >
                              {competition.registration_status === 'approved' ? 'Registered' :
                               competition.registration_status === 'pending' ? 'Pending Approval' : 'Rejected'}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
                            <h3 className="text-lg sm:text-xl font-bold group-hover:text-primary-blue transition-colors">
                              {competition.title}
                            </h3>
                            {competition.countdown && (
                              <span className="text-xs sm:text-sm text-text-secondary">
                                {competition.countdown.label}:{' '}
                                <span className="font-mono font-semibold text-primary-blue">
                                  {competition.countdown.days}d {competition.countdown.hours}h {competition.countdown.minutes}m
                                </span>
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-mono uppercase tracking-wide text-text-tertiary mb-3 sm:mb-4">
                            {metricInfo?.name ?? competition.scoring_metric.replace('_', ' ')}
                            {' · '}
                            {competition.participation_type === 'team' ? 'Team' : 'Individual'}
                            {' · '}
                            {competition.participant_count} participant{competition.participant_count !== 1 ? 's' : ''}
                            {compRanks[competition.id] && (
                              <>
                                {' · '}
                                <span className="text-accent-cyan font-semibold">
                                  Rank #{compRanks[competition.id].rank} of {compRanks[competition.id].total}
                                </span>
                              </>
                            )}
                          </p>

                          {/* Timeline Bar */}
                          <div>
                            <div className="relative h-2 bg-bg-elevated rounded-full overflow-hidden">
                              <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-blue to-accent-cyan rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-text-tertiary">
                              <span>{regStart.toLocaleDateString()}</span>
                              <span>{(privateEnd || publicEnd).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <Card className="relative overflow-hidden p-6 sm:p-8 text-center">
                  <Trophy
                    className="absolute -bottom-6 -right-6 h-28 w-28 text-primary-blue/[0.07] rotate-[-10deg] pointer-events-none [filter:drop-shadow(0_0_20px_rgba(37,99,235,0.3))]"
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <h3 className="text-lg font-bold mb-2">You haven&apos;t joined a competition yet</h3>
                    <p className="text-text-secondary text-sm mb-5 max-w-md mx-auto">
                      Register for a competition to track your progress, submit solutions, and climb the leaderboard.
                    </p>
                    <Link href="/competitions">
                      <Button variant="primary" className="gap-2">
                        Find a competition
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}
            </section>

            {/* Open for Registration */}
            {openCompetitions.length > 0 && (
              <section>
                <h2 className="text-xl sm:text-2xl font-bold mb-5">Open for Registration</h2>
                <div className="space-y-3">
                  {openCompetitions.map((competition) => (
                    <Card
                      key={competition.id}
                      className="p-4 sm:p-5 hover:border-primary-blue/50 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-text-primary mb-1 truncate">{competition.title}</h3>
                          <p className="text-xs text-text-tertiary">
                            Registration{competition.phase === 'upcoming' ? ' opens' : ' closes'}:{' '}
                            {new Date(
                              competition.phase === 'upcoming'
                                ? competition.registration_start
                                : competition.registration_end
                            ).toLocaleDateString()}
                            {' · '}{competition.participant_count} participant{competition.participant_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Link href={`/competitions/${competition.id}`} className="shrink-0">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            View &amp; Register
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Practice section */}
            {practiceProblems.length > 0 && (
              <section>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {hasPracticed ? 'Continue Practicing' : 'Keep Your Skills Sharp'}
                  </h2>
                  <Link
                    href="/practice"
                    className="text-sm font-semibold text-primary-blue hover:text-accent-cyan transition-colors shrink-0"
                  >
                    All problems &rarr;
                  </Link>
                </div>
                <p className="text-sm text-text-secondary mb-5">
                  {hasPracticed
                    ? 'Pick up where you left off, or try a new problem to push your best score higher.'
                    : 'No deadline, no pressure — practice on real ML problems anytime and compare your score on the leaderboard.'}
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {practiceProblems.map((problem: any) => (
                    <PracticeProblemCard
                      key={problem.id}
                      problem={problem}
                      bestScore={practiceBestScores[problem.id] ?? null}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT SIDEBAR - Teams + activity */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-6">
            <TeamsSidebar userTeams={userTeams} invitations={invitations || []} />

            {/* Recent activity */}
            {activityItems.length > 0 && (
              <Card className="relative overflow-hidden p-5 sm:p-6">
                <Activity className="absolute -bottom-6 -right-6 h-24 w-24 text-primary-blue/[0.07] rotate-[-10deg] pointer-events-none select-none [filter:drop-shadow(0_0_20px_rgba(37,99,235,0.3))]" />
                <div className="relative">
                  <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                  <div className="space-y-1">
                    {activityItems.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="block -mx-2 px-2 py-2 rounded-lg hover:bg-bg-elevated/60 transition-colors"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {item.title}
                          </p>
                          <span className="font-mono text-xs shrink-0">
                            {item.score !== null ? (
                              <span className="text-accent-cyan font-semibold">
                                {item.score.toFixed(item.decimals)}
                              </span>
                            ) : item.validation_status === 'invalid' ? (
                              <span className="text-error">Invalid</span>
                            ) : (
                              <span className="text-text-tertiary">Pending</span>
                            )}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono uppercase tracking-wide text-text-tertiary mt-0.5">
                          {item.kind} · {timeAgo(item.submitted_at)}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
