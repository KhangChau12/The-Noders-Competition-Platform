import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import CountdownTimer from '@/components/competition/CountdownTimer';
import HorizontalTimeline from '@/components/competition/HorizontalTimeline';
import CompetitionTabs from './CompetitionTabs';
import { SCORING_METRIC_INFO } from '@/lib/constants';
import { getCompetitionPhase, getNextDeadline, getCountdownLabel } from '@/lib/utils/competition';
import {
  Clock,
  Trophy,
  Users,
  Target,
  Download,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
} from 'lucide-react';

interface CompetitionDetailPageProps {
  params: { id: string };
}

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

      if (competition.participation_type === 'individual') {
        const { count: totalCount } = await supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('competition_id', id)
          .eq('user_id', user.id)
          .eq('validation_status', 'valid');

        const { count: dailyCount } = await supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('competition_id', id)
          .eq('user_id', user.id)
          .eq('validation_status', 'valid')
          .gte('submitted_at', today.toISOString());

        submissionCount = { daily: dailyCount || 0, total: totalCount || 0 };
      } else if (registeredTeamId) {
        const { count: totalCount } = await supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('competition_id', id)
          .eq('team_id', registeredTeamId)
          .eq('validation_status', 'valid');

        const { count: dailyCount } = await supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('competition_id', id)
          .eq('team_id', registeredTeamId)
          .eq('validation_status', 'valid')
          .gte('submitted_at', today.toISOString());

        submissionCount = { daily: dailyCount || 0, total: totalCount || 0 };
      }
    }
  }

  const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const ascending = metricInfo?.higher_is_better === false;
  const is4Phase = competition.competition_type === '4-phase';
  const privateTestStart = competition.private_test_start ? new Date(competition.private_test_start) : null;
  const isPrivatePhaseStarted = privateTestStart && new Date() >= privateTestStart;

  const { data: allSubmissions } = (await supabase
    .from('submissions')
    .select(`
      id, score, submitted_at, user_id, team_id, phase, validation_status,
      users!submissions_user_id_fkey (id, full_name, email),
      teams!submissions_team_id_fkey (id, name)
    `)
    .eq('competition_id', id)
    .eq('validation_status', 'valid')
    .order('score', { ascending })
    .order('submitted_at', { ascending: true })) as { data: any; error: any };

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

  const { data: participantData } = (await supabase
    .from('competition_participant_counts')
    .select('participant_count')
    .eq('competition_id', id)
    .single()) as { data: { participant_count: number } | null };

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

  const phaseBadgeVariant =
    currentPhase === 'registration' ? 'registration' :
    currentPhase === 'public_test' ? 'public' :
    currentPhase === 'private_test' ? 'private' :
    currentPhase === 'ended' ? 'ended' : 'secondary';

  const phaseLabel =
    currentPhase === 'upcoming' ? 'Upcoming' :
    currentPhase === 'registration' ? 'Registration Open' :
    currentPhase === 'public_test' ? 'Public Test' :
    currentPhase === 'private_test' ? 'Private Test' : 'Ended';

  return (
    <div className="min-h-screen">
      {/* ── Hero header ── */}
      <div className="px-4 sm:px-6 pt-8 pb-6 sm:pt-10 sm:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Phase + meta */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant={phaseBadgeVariant}>{phaseLabel}</Badge>
            <span className="text-xs font-mono uppercase tracking-wide text-text-tertiary">
              {competition.participation_type} · {competition.competition_type}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-brand text-3xl sm:text-4xl lg:text-5xl mb-3 gradient-text leading-tight">
            {competition.title}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-text-secondary mb-5 max-w-3xl leading-relaxed">
            {competition.description}
          </p>

          {/* Quick stats row — scrollable on mobile */}
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-none pb-1 text-sm text-text-secondary">
            <div className="flex items-center gap-1.5 shrink-0">
              <Users className="w-4 h-4 text-text-tertiary" />
              <span>
                {competition.participation_type === 'team'
                  ? `${competition.min_team_size}–${competition.max_team_size} members`
                  : 'Individual'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Target className="w-4 h-4 text-text-tertiary" />
              <span>
                {metricInfo?.name || 'F1 Score'}
                {metricInfo?.higher_is_better === false && ' ↓'}
                {metricInfo?.higher_is_better === true && ' ↑'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Trophy className="w-4 h-4 text-text-tertiary" />
              <span>{participantCount} participants</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main body ── */}
      <div className="px-4 sm:px-6 pb-12">
        <div className="max-w-7xl mx-auto">

          {/* ── Mobile action strip (visible < lg) ── */}
          {user && registration?.status === 'approved' && (
            <div className="lg:hidden mb-5 flex gap-2">
              {competition.dataset_url && (
                <a href={competition.dataset_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <Download className="w-4 h-4" />
                    Dataset
                  </Button>
                </a>
              )}
              {canSubmit ? (
                <Link href={`/competitions/${id}/submit`} className="flex-1">
                  <Button variant="primary" size="sm" className="w-full gap-1.5">
                    <ArrowRight className="w-4 h-4" />
                    Submit
                  </Button>
                </Link>
              ) : (
                <Button variant="primary" size="sm" disabled className="flex-1">
                  Submit
                </Button>
              )}
            </div>
          )}

          {/* ── Not registered — mobile CTA ── */}
          {user && !registration && currentPhase !== 'ended' && (
            <div className="lg:hidden mb-5">
              <Link href={`/competitions/${id}/register`}>
                <Button variant="primary" size="sm" className="w-full">
                  {currentPhase === 'registration' ? 'Register Now' : 'Late Registration'}
                </Button>
              </Link>
            </div>
          )}
          {!user && currentPhase !== 'ended' && (
            <div className="lg:hidden mb-5">
              <Link href="/login">
                <Button variant="primary" size="sm" className="w-full">
                  Log in to Register
                </Button>
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Left / main (2 cols on lg) ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Countdown + timeline */}
              <Card className="p-4 sm:p-6 overflow-hidden">
                {nextDeadline && currentPhase !== 'ended' ? (
                  <>
                    <CountdownTimer
                      targetDate={nextDeadline}
                      label={getCountdownLabel(currentPhase)}
                      className="w-full mb-5"
                    />
                    <div className="pt-4 border-t border-border-default overflow-x-auto">
                      <HorizontalTimeline competition={competition} />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-center text-text-tertiary text-sm mb-4">Competition Ended</p>
                    <div className="overflow-x-auto">
                      <HorizontalTimeline competition={competition} />
                    </div>
                  </>
                )}
              </Card>

              {/* Dataset + submit (desktop only — shown in sidebar on desktop) */}
              {canDownloadDataset && (
                <Card className="hidden lg:block p-5">
                  <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-4">
                    Dataset & Submission
                  </h3>
                  <div className="flex gap-3">
                    {competition.dataset_url && (
                      <a href={competition.dataset_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button variant="outline" className="w-full gap-2">
                          <Download className="w-4 h-4" />
                          Download Dataset
                        </Button>
                      </a>
                    )}
                    {canSubmit ? (
                      <Link href={`/competitions/${id}/submit`} className="flex-1">
                        <Button variant="primary" className="w-full gap-2">
                          <ArrowRight className="w-4 h-4" />
                          Submit Solution
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="primary" disabled className="flex-1" title={
                        dailyLimitReached ? 'Daily limit reached' :
                        totalLimitReached ? 'Total limit reached' :
                        'Submissions not available'
                      }>
                        Submit Solution
                      </Button>
                    )}
                  </div>
                  {!canSubmit && (
                    <p className="text-xs text-text-tertiary mt-3">
                      {dailyLimitReached && 'Daily submission limit reached. '}
                      {totalLimitReached && 'Total submission limit reached. '}
                      {!dailyLimitReached && !totalLimitReached && currentPhase === 'registration' && 'Submissions open after registration phase. '}
                      {!dailyLimitReached && !totalLimitReached && currentPhase === 'ended' && 'Competition has ended. '}
                    </p>
                  )}
                </Card>
              )}

              {/* Tabs */}
              <CompetitionTabs
                competition={competition}
                leaderboard={leaderboard || []}
                isRegistered={registration?.status === 'approved'}
                userId={user?.id}
              />
            </div>

            {/* ── Sidebar (right, 1 col on lg) ── */}
            <div className="space-y-5">

              {/* Registration status */}
              {user ? (
                <Card className="p-4 sm:p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary mb-4">
                    Your Status
                  </h3>

                  {!registration && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <XCircle className="w-4 h-4 text-text-disabled shrink-0" />
                        Not registered
                      </div>
                      {currentPhase !== 'ended' && (
                        <Link href={`/competitions/${id}/register`} className="block">
                          <Button variant="primary" size="sm" className="w-full">
                            {currentPhase === 'registration' ? 'Register Now' : 'Late Registration'}
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}

                  {registration?.status === 'pending' && (
                    <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/20 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-warning">Pending Approval</p>
                        <p className="text-xs text-text-tertiary mt-0.5">Awaiting admin review</p>
                      </div>
                    </div>
                  )}

                  {registration?.status === 'approved' && (
                    <>
                      <div className="flex items-start gap-3 p-3 bg-success/10 border border-success/20 rounded-xl mb-4">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-success">Registered & Approved</p>
                          <p className="text-xs text-text-tertiary mt-0.5">You can submit solutions</p>
                        </div>
                      </div>

                      {/* Quota grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-bg-elevated rounded-xl border border-border-default">
                          <p className="text-xs text-text-tertiary mb-1">Daily</p>
                          <p className="text-xl font-bold leading-none">
                            <span className={dailyLimitReached ? 'text-error' : 'text-primary-blue'}>
                              {submissionCount.daily}
                            </span>
                            <span className="text-text-disabled text-base">/{dailyLimit}</span>
                          </p>
                          {dailyLimitReached && (
                            <p className="text-[10px] text-error mt-1">Limit reached</p>
                          )}
                        </div>
                        <div className="p-3 bg-bg-elevated rounded-xl border border-border-default">
                          <p className="text-xs text-text-tertiary mb-1">Total</p>
                          <p className="text-xl font-bold text-primary-blue leading-none">
                            {submissionCount.total}
                          </p>
                        </div>
                      </div>

                      {/* Mobile submit button inside card */}
                      {canSubmit && (
                        <Link href={`/competitions/${id}/submit`} className="block mt-4 lg:hidden">
                          <Button variant="primary" size="sm" className="w-full gap-2">
                            <ArrowRight className="w-4 h-4" />
                            Submit Solution
                          </Button>
                        </Link>
                      )}
                    </>
                  )}

                  {registration?.status === 'rejected' && (
                    <div className="flex items-start gap-3 p-3 bg-error/10 border border-error/20 rounded-xl">
                      <XCircle className="w-4 h-4 text-error mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-error">Registration Rejected</p>
                        <p className="text-xs text-text-tertiary mt-0.5">Not approved by admins</p>
                      </div>
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="p-4 sm:p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary mb-3">
                    Participation
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">
                    Log in to register and compete.
                  </p>
                  <Link href="/login" className="block">
                    <Button variant="primary" size="sm" className="w-full">Log In to Register</Button>
                  </Link>
                </Card>
              )}

              {/* Evaluation criteria */}
              <Card className="p-4 sm:p-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary mb-4">
                  Evaluation
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-bg-elevated rounded-xl border border-border-default">
                    <p className="text-xs text-text-tertiary mb-1">Scoring Metric</p>
                    <p className="font-semibold text-primary-blue text-sm">
                      {metricInfo?.name || competition.scoring_metric}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {metricInfo?.higher_is_better === false ? 'Lower is better ↓' : 'Higher is better ↑'}
                    </p>
                    {metricInfo?.description && (
                      <p className="text-xs text-text-tertiary mt-2 leading-relaxed">
                        {metricInfo.description}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-bg-elevated rounded-xl border border-border-default">
                    <p className="text-xs text-text-tertiary mb-1">Submission Format</p>
                    <p className="font-semibold text-sm flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-text-tertiary" />
                      CSV File
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Max {competition.max_file_size_mb || 10} MB
                    </p>
                  </div>
                </div>
              </Card>

              {/* Top participants preview */}
              <Card className="p-4 sm:p-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary mb-4">
                  Top Participants
                </h3>
                {leaderboard && leaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((entry: any, index: number) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
                          index === 0 ? 'bg-warning/5 border-warning/20' : 'bg-bg-elevated border-border-default'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`font-bold text-sm shrink-0 ${
                            index === 0 ? 'text-warning' :
                            index === 1 ? 'text-text-secondary' :
                            index === 2 ? 'text-phase-registration' : 'text-text-tertiary'
                          }`}>
                            #{index + 1}
                          </span>
                          <span className="text-sm text-text-secondary truncate">
                            {competition.participation_type === 'team'
                              ? (entry.teams?.name || 'Unknown Team')
                              : (entry.users?.full_name || entry.users?.email?.split('@')[0] || 'Anonymous')}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-primary-blue text-sm shrink-0 ml-2">
                          {entry.score?.toFixed(4) || '0.0000'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-text-disabled opacity-40" />
                    <p className="text-sm text-text-tertiary">No submissions yet</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
