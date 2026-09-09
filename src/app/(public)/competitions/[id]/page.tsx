import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { StatRun, type StatItem } from '@/components/ui/StatRun';
import PhaseTimeline from '@/components/competition/PhaseTimeline';
import CompetitionTabs from './CompetitionTabs';
import DetailCountdown from './DetailCountdown';
import { SCORING_METRIC_INFO, metricShortName, metricArrow } from '@/lib/constants';
import { getCompetitionPhase, getNextDeadline } from '@/lib/utils/competition';
import { Download, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface CompetitionDetailPageProps {
  params: { id: string };
}

const PHASE_WORD: Record<
  ReturnType<typeof getCompetitionPhase>,
  { label: string; tone: string; glow: boolean }
> = {
  upcoming: { label: 'Upcoming', tone: 'text-text-tertiary', glow: false },
  registration: { label: 'Registration open', tone: 'text-[#A78BFA]', glow: true },
  public_test: { label: 'Public test', tone: 'text-[#60A5FA]', glow: true },
  private_test: { label: 'Private test', tone: 'text-[#22D3EE]', glow: true },
  ended: { label: 'Ended', tone: 'text-text-tertiary', glow: false },
};

export default async function CompetitionDetailPage({ params }: CompetitionDetailPageProps) {
  const { id } = params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: competition, error: competitionError } = (await supabase
    .from('competitions')
    .select(
      'id, title, description, problem_statement, competition_type, participation_type, registration_start, registration_end, public_test_start, public_test_end, private_test_start, private_test_end, daily_submission_limit, total_submission_limit, max_file_size_mb, min_team_size, max_team_size, scoring_metric, dataset_url, deleted_at'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()) as { data: any; error: any };

  if (competitionError || !competition) notFound();

  const currentPhase = getCompetitionPhase(competition);
  const nextDeadline = getNextDeadline(competition, currentPhase);

  const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const ascending = metricInfo?.higher_is_better === false;

  let registration = null;
  let submissionCount = { daily: 0, total: 0 };
  let registeredTeamId: string | null = null;

  if (user) {
    if (competition.participation_type === 'individual') {
      const { data: regData } = (await supabase
        .from('registrations')
        .select('id, status, user_id, team_id')
        .eq('competition_id', id)
        .eq('user_id', user.id)
        .single()) as { data: any };
      registration = regData;
    } else {
      const { data: teamMemberships } = (await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)) as { data: any };

      if (teamMemberships && teamMemberships.length > 0) {
        const teamIds = teamMemberships.map((m: any) => m.team_id);
        const { data: teamReg } = (await supabase
          .from('registrations')
          .select('id, status, user_id, team_id')
          .eq('competition_id', id)
          .in('team_id', teamIds)
          .eq('status', 'approved')
          .limit(1)
          .single()) as { data: any };

        if (teamReg) {
          registration = teamReg;
          registeredTeamId = teamReg.team_id;
        }
      }
    }

    if (registration && registration.status === 'approved') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const entityFilter: [string, string] =
        competition.participation_type === 'individual'
          ? ['user_id', user.id]
          : ['team_id', registeredTeamId as string];

      if (competition.participation_type === 'individual' || registeredTeamId) {
        const [{ count: totalCount }, { count: dailyCount }] = await Promise.all([
          supabase
            .from('submissions')
            .select('id', { count: 'exact', head: true })
            .eq('competition_id', id)
            .eq(entityFilter[0], entityFilter[1])
            .eq('validation_status', 'valid'),
          supabase
            .from('submissions')
            .select('id', { count: 'exact', head: true })
            .eq('competition_id', id)
            .eq(entityFilter[0], entityFilter[1])
            .eq('validation_status', 'valid')
            .gte('submitted_at', today.toISOString()),
        ]);

        submissionCount = { daily: dailyCount || 0, total: totalCount || 0 };
      }
    }
  }

  const is4Phase = competition.competition_type === '4-phase';
  const privateTestStart = competition.private_test_start ? new Date(competition.private_test_start) : null;
  const isPrivatePhaseStarted = privateTestStart && new Date() >= privateTestStart;

  // Leaderboard source and participant count are independent of one another and
  // of the user's registration — fetch them together.
  const [{ data: allSubmissions }, { data: participantData }] = (await Promise.all([
    supabase
      .from('submissions')
      .select(`
        id, score, submitted_at, user_id, team_id, phase, validation_status,
        users!submissions_user_id_fkey (id, full_name, email),
        teams!submissions_team_id_fkey (id, name)
      `)
      .eq('competition_id', id)
      .eq('validation_status', 'valid')
      .order('score', { ascending })
      .order('submitted_at', { ascending: true }),
    supabase
      .from('competition_participant_counts')
      .select('participant_count')
      .eq('competition_id', id)
      .single(),
  ])) as [{ data: any }, { data: { participant_count: number } | null }];

  let leaderboard: any[] = [];

  if (is4Phase && isPrivatePhaseStarted) {
    const participantPhaseScores = new Map<string, { public?: any; private?: any; participant: any; participantId: string }>();
    const submissionCounts = new Map<string, number>();

    allSubmissions?.forEach((sub: any) => {
      const participantId = sub.user_id || sub.team_id;
      if (!participantId) return;
      submissionCounts.set(participantId, (submissionCounts.get(participantId) || 0) + 1);
      if (!participantPhaseScores.has(participantId)) {
        participantPhaseScores.set(participantId, { participant: sub.users || sub.teams, participantId });
      }
      const entry = participantPhaseScores.get(participantId)!;
      if (sub.phase === 'public' && !entry.public) entry.public = sub;
      else if (sub.phase === 'private' && !entry.private) entry.private = sub;
    });

    const combinedScores = Array.from(participantPhaseScores.values())
      .filter(entry => entry.public && entry.private)
      .map(entry => {
        const combinedScore = (entry.public!.score + entry.private!.score) / 2;
        return {
          ...entry.public,
          score: combinedScore,
          phase_count: 2,
          public_score: entry.public!.score,
          private_score: entry.private!.score,
          submission_count: submissionCounts.get(entry.participantId) || 0,
        };
      });

    combinedScores.sort((a, b) => ascending ? a.score - b.score : b.score - a.score);
    leaderboard = combinedScores.slice(0, 10);
  } else {
    const userBestScores = new Map();
    const submissionCounts = new Map();

    allSubmissions?.filter((sub: any) => sub.phase === 'public').forEach((sub: any) => {
      const userId = sub.user_id || sub.team_id;
      if (!userId) return;
      submissionCounts.set(userId, (submissionCounts.get(userId) || 0) + 1);
      if (!userBestScores.has(userId)) userBestScores.set(userId, sub);
    });

    leaderboard = Array.from(userBestScores.values()).map((entry: any) => ({
      ...entry,
      submission_count: submissionCounts.get(entry.user_id || entry.team_id) || 0,
    })).slice(0, 10);
  }

  const participantCount = participantData?.participant_count || 0;

  const canDownloadDataset = registration?.status === 'approved';
  const dailyLimit = competition.daily_submission_limit ?? 15;
  const totalLimit = competition.total_submission_limit ?? 10000;
  const dailyLimitReached = submissionCount.daily >= dailyLimit;
  const totalLimitReached = submissionCount.total >= totalLimit;
  const canSubmit = canDownloadDataset &&
    !dailyLimitReached &&
    !totalLimitReached &&
    (currentPhase === 'public_test' || currentPhase === 'private_test');

  const phaseWord = PHASE_WORD[currentPhase];

  const heroStats: StatItem[] = [
    { label: 'Participants', value: String(participantCount) },
    {
      label: 'Scoring metric',
      value: `${metricShortName(competition.scoring_metric)} ${metricArrow(competition.scoring_metric)}`,
      tone: 'blue',
    },
    {
      label: 'Team size',
      value:
        competition.participation_type === 'team'
          ? `${competition.min_team_size}–${competition.max_team_size}`
          : 'Individual',
    },
    { label: 'Total subs', value: String(allSubmissions?.length ?? 0) },
  ];
  if (registration?.status === 'approved') {
    heroStats.splice(3, 0, {
      label: 'Your quota',
      value: (
        <>
          {submissionCount.daily}
          <span className="text-xs font-normal text-text-disabled"> / {dailyLimit} today</span>
        </>
      ),
      tone: dailyLimitReached ? 'warn' : 'default',
    });
  }

  const showRegisterPanel = currentPhase !== 'ended' && (!registration || !user);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto">

        {/* ── Breadcrumb ── */}
        <Link
          href="/competitions"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-text-tertiary hover:text-text-secondary transition-colors mb-3.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Competitions
        </Link>

        {/* ── Eyebrow ── */}
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 mb-2.5 text-xs">
          <span className={`inline-flex items-center gap-[7px] font-bold ${phaseWord.tone}`}>
            <span
              className="w-[7px] h-[7px] rounded-full bg-current"
              style={phaseWord.glow ? { boxShadow: '0 0 0 3px color-mix(in srgb, currentColor 20%, transparent)' } : undefined}
            />
            {phaseWord.label}
          </span>
          <span className="font-semibold text-text-tertiary capitalize">
            {competition.participation_type} · {competition.competition_type}
          </span>
        </div>

        {/* ── Title ── */}
        <h1 className="text-2xl sm:text-[2rem] font-bold tracking-[-0.01em] leading-[1.15] text-text-primary mb-2.5">
          {competition.title}
        </h1>

        {/* ── Description ── */}
        <p className="text-sm text-text-secondary leading-[1.6] mb-6">
          {competition.description}
        </p>

        {/* ── Hero stat run ── */}
        <StatRun size="sm" items={heroStats} className="mb-6" />

        {/* ── Phase timeline (+ demoted countdown on desktop) ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6 mb-6">
          <PhaseTimeline competition={competition} className="flex-1 min-w-0" />
          {nextDeadline && currentPhase !== 'ended' && (
            <div className="hidden sm:block text-right shrink-0">
              <DetailCountdown target={nextDeadline.toISOString()} />
            </div>
          )}
        </div>

        {/* ── Action line / register panel ── */}
        {showRegisterPanel ? (
          <div className="mb-6 rounded-xl border border-[color:rgba(37,99,235,0.35)] bg-bg-surface p-4 sm:p-[18px] shadow-[0_0_24px_rgba(37,99,235,0.12)]">
            <h3 className="text-sm font-extrabold text-text-primary mb-1">
              {currentPhase === 'registration' ? 'Registration is open' : 'Late registration available'}
            </h3>
            <p className="text-sm text-text-secondary mb-3">
              {user
                ? 'Register to download the dataset and submit solutions.'
                : 'Log in to register and compete.'}
            </p>
            <Link href={user ? `/competitions/${id}/register` : '/login'}>
              <Button variant="primary" size="sm" className="gap-2">
                {user
                  ? currentPhase === 'registration'
                    ? 'Register now'
                    : 'Late registration'
                  : 'Log in to register'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-3 mb-6">
            <RegistrationStatusLine
              registration={registration}
              participationType={competition.participation_type}
            />
            <span className="flex-1 hidden sm:block" />
            {canDownloadDataset && competition.dataset_url && (
              <a
                href={competition.dataset_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary"
              >
                <Download className="w-3.5 h-3.5 text-[#60A5FA]" />
                Download dataset
              </a>
            )}
            {registration?.status === 'approved' &&
              (canSubmit ? (
                <Link href={`/competitions/${id}/submit`}>
                  <Button variant="primary" size="sm" className="gap-2">
                    Submit solution
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  disabled
                  title={
                    dailyLimitReached
                      ? 'Daily limit reached'
                      : totalLimitReached
                        ? 'Total limit reached'
                        : 'Submissions not open'
                  }
                >
                  Submit solution
                </Button>
              ))}
          </div>
        )}

        {/* ── Tabs ── */}
        <CompetitionTabs
          competition={competition}
          leaderboard={leaderboard || []}
          isRegistered={registration?.status === 'approved'}
          userId={user?.id}
          currentPhase={currentPhase}
        />
      </div>
    </div>
  );
}

function RegistrationStatusLine({
  registration,
  participationType,
}: {
  registration: any;
  participationType: string;
}) {
  if (registration?.status === 'approved') {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-text-tertiary">
        <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
        Registered &amp; approved
        {participationType === 'team' && registration.team_id && (
          <span className="text-text-secondary font-bold">— your team</span>
        )}
      </span>
    );
  }
  if (registration?.status === 'pending') {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-[#FBBF24]">
        <AlertCircle className="w-4 h-4 shrink-0" />
        Registration pending admin review
      </span>
    );
  }
  if (registration?.status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-[#F87171]">
        <XCircle className="w-4 h-4 shrink-0" />
        Registration rejected
      </span>
    );
  }
  return null;
}
