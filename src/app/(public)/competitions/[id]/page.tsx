import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import CountdownTimer from '@/components/competition/CountdownTimer';
import PhaseIndicator from '@/components/competition/PhaseIndicator';
import CompetitionTabs from './CompetitionTabs';
import {
  Clock,
  Trophy,
  Users,
  Target,
  Download,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface CompetitionDetailPageProps {
  params: {
    id: string;
  };
}

// Helper function to determine current phase
function getCurrentPhase(competition: any): 'upcoming' | 'registration' | 'public_test' | 'private_test' | 'ended' {
  const now = new Date();
  const registrationStart = new Date(competition.registration_start);
  const registrationEnd = new Date(competition.registration_end);
  const publicTestStart = new Date(competition.public_test_start);
  const publicTestEnd = new Date(competition.public_test_end);
  const privateTestStart = competition.private_test_start ? new Date(competition.private_test_start) : null;
  const privateTestEnd = competition.private_test_end ? new Date(competition.private_test_end) : null;

  if (now < registrationStart) return 'upcoming';
  if (now >= registrationStart && now < registrationEnd) return 'registration';
  if (now >= registrationEnd && now < publicTestEnd) return 'public_test';
  if (privateTestStart && privateTestEnd && now >= publicTestStart && now < privateTestEnd) return 'private_test';
  return 'ended';
}

// Helper function to get next deadline
function getNextDeadline(competition: any, currentPhase: string): Date | null {
  const now = new Date();

  if (currentPhase === 'upcoming') {
    return new Date(competition.registration_start);
  }
  if (currentPhase === 'registration') {
    return new Date(competition.registration_end);
  }
  if (currentPhase === 'public_test') {
    return new Date(competition.public_test_end);
  }
  if (currentPhase === 'private_test' && competition.private_test_end) {
    return new Date(competition.private_test_end);
  }

  return null;
}

// Helper function to get countdown label
function getCountdownLabel(currentPhase: string): string {
  switch (currentPhase) {
    case 'upcoming':
      return 'Registration starts in';
    case 'registration':
      return 'Registration ends in';
    case 'public_test':
      return 'Public test ends in';
    case 'private_test':
      return 'Private test ends in';
    default:
      return 'Competition ended';
  }
}

export default async function CompetitionDetailPage({ params }: CompetitionDetailPageProps) {
  const { id } = params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch competition with full details
  const { data: competition, error: competitionError } = (await supabase
    .from('competitions')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()) as { data: any; error: any };

  if (competitionError || !competition) {
    notFound();
  }

  // Determine current phase
  const currentPhase = getCurrentPhase(competition);
  const nextDeadline = getNextDeadline(competition, currentPhase);

  // Fetch user's registration status if logged in
  let registration = null;
  let submissionCount = { daily: 0, total: 0 };

  if (user) {
    const { data: regData } = (await supabase
      .from('registrations')
      .select('*')
      .eq('competition_id', id)
      .eq('user_id', user.id)
      .single()) as { data: any };

    registration = regData;

    // If approved, get submission counts
    if (registration && registration.status === 'approved') {
      // Total submissions
      const { count: totalCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('competition_id', id)
        .eq('user_id', user.id);

      // Daily submissions (today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: dailyCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('competition_id', id)
        .eq('user_id', user.id)
        .gte('submitted_at', today.toISOString());

      submissionCount = {
        daily: dailyCount || 0,
        total: totalCount || 0,
      };
    }
  }

  // Fetch leaderboard preview (top 10) - showing public test scores
  // For each user, get their best score
  const { data: allSubmissions } = (await supabase
    .from('submissions')
    .select(`
      id,
      score,
      submitted_at,
      user_id,
      team_id,
      phase,
      validation_status,
      users!submissions_user_id_fkey (
        id,
        full_name,
        email
      ),
      teams!submissions_team_id_fkey (
        id,
        name,
        leader_id
      )
    `)
    .eq('competition_id', id)
    .eq('validation_status', 'valid')
    .eq('phase', 'public')
    .order('score', { ascending: false })
    .order('submitted_at', { ascending: true })) as { data: any; error: any };

  // Get unique users with their best scores
  const userBestScores = new Map();
  allSubmissions?.forEach((sub: any) => {
    const userId = sub.user_id || sub.team_id;
    if (!userId) return;

    if (!userBestScores.has(userId)) {
      userBestScores.set(userId, sub);
    }
  });

  const leaderboard = Array.from(userBestScores.values()).slice(0, 10);

  // Check if user can submit
  const canDownloadDataset = registration?.status === 'approved';
  const dailyLimitReached = submissionCount.daily >= competition.daily_submission_limit;
  const totalLimitReached = submissionCount.total >= competition.total_submission_limit;
  const canSubmit = canDownloadDataset &&
                    !dailyLimitReached &&
                    !totalLimitReached &&
                    (currentPhase === 'public_test' || currentPhase === 'private_test');

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge
              variant={
                currentPhase === 'registration' ? 'registration' :
                currentPhase === 'public_test' ? 'public' :
                currentPhase === 'private_test' ? 'private' :
                currentPhase === 'ended' ? 'ended' : 'secondary'
              }
            >
              {currentPhase === 'upcoming' && 'Upcoming'}
              {currentPhase === 'registration' && 'Registration Open'}
              {currentPhase === 'public_test' && 'Public Test Phase'}
              {currentPhase === 'private_test' && 'Private Test Phase'}
              {currentPhase === 'ended' && 'Ended'}
            </Badge>
            <Badge variant="outline">{competition.participation_type}</Badge>
            <Badge variant="outline">{competition.competition_type}</Badge>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl mb-4 gradient-text">
            {competition.title}
          </h1>

          {/* Description */}
          <p className="text-xl text-text-secondary mb-8 max-w-4xl">
            {competition.description}
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6 text-text-secondary">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>
                {competition.participation_type === 'team'
                  ? `Teams: ${competition.min_team_size}-${competition.max_team_size} members`
                  : 'Individual'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              <span>Metric: {competition.scoring_metric || 'F1 Score'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <span>{leaderboard?.length || 0} participants</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3) */}
          <div className="md:col-span-2 lg:col-span-2 space-y-6">
            {/* Countdown Timer */}
            {nextDeadline && currentPhase !== 'ended' && (
              <Card className="p-8">
                <CountdownTimer
                  targetDate={nextDeadline}
                  label={getCountdownLabel(currentPhase)}
                  className="w-full"
                />
              </Card>
            )}

            {/* Registration Status */}
            {user && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Registration Status
                </h3>

                {!registration && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-text-tertiary" />
                      <span className="text-text-secondary">Not registered</span>
                    </div>
                    {currentPhase !== 'ended' && (
                      <Link href={`/competitions/${id}/register`}>
                        <Button variant="primary" size="md">
                          {currentPhase === 'registration' ? 'Register Now' : 'Late Registration'}
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {registration?.status === 'pending' && (
                  <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-warning" />
                    <div>
                      <p className="font-semibold text-warning">Pending Approval</p>
                      <p className="text-sm text-text-tertiary">Your registration is being reviewed by admins</p>
                    </div>
                  </div>
                )}

                {registration?.status === 'approved' && (
                  <div>
                    <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg mb-4">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <div>
                        <p className="font-semibold text-success">Registered & Approved</p>
                        <p className="text-sm text-text-tertiary">You can now download the dataset and submit solutions</p>
                      </div>
                    </div>

                    {/* Submission Quota */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="p-4 bg-bg-elevated rounded-lg border border-border-default">
                        <p className="text-sm text-text-tertiary mb-1">Daily Submissions</p>
                        <p className="text-2xl font-bold">
                          <span className={dailyLimitReached ? 'text-error' : 'text-primary-blue'}>
                            {submissionCount.daily}
                          </span>
                          <span className="text-text-tertiary">/{competition.daily_submission_limit}</span>
                        </p>
                        {dailyLimitReached && (
                          <p className="text-xs text-error mt-1">Daily limit reached</p>
                        )}
                      </div>

                      <div className="p-4 bg-bg-elevated rounded-lg border border-border-default">
                        <p className="text-sm text-text-tertiary mb-1">Total Submissions</p>
                        <p className="text-2xl font-bold">
                          <span className={totalLimitReached ? 'text-error' : 'text-primary-blue'}>
                            {submissionCount.total}
                          </span>
                          <span className="text-text-tertiary">/{competition.total_submission_limit}</span>
                        </p>
                        {totalLimitReached && (
                          <p className="text-xs text-error mt-1">Total limit reached</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {registration?.status === 'rejected' && (
                  <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-lg">
                    <XCircle className="w-5 h-5 text-error" />
                    <div>
                      <p className="font-semibold text-error">Registration Rejected</p>
                      <p className="text-sm text-text-tertiary">Your registration was not approved</p>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Dataset Download & Submit */}
            {canDownloadDataset && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Dataset & Submission
                </h3>

                <div className="flex flex-col sm:flex-row gap-4">
                  {competition.dataset_url && (
                    <a
                      href={competition.dataset_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="lg" className="w-full">
                        <Download className="w-5 h-5 mr-2" />
                        Download Dataset
                      </Button>
                    </a>
                  )}

                  {canSubmit ? (
                    <Link href={`/competitions/${id}/submit`} className="flex-1">
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                      >
                        <ArrowRight className="w-5 h-5 mr-2" />
                        Submit Solution
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      disabled={true}
                      className="flex-1"
                      title={dailyLimitReached ? "Daily limit reached" : totalLimitReached ? "Total limit reached" : "Submissions not available"}
                    >
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Submit Solution
                    </Button>
                  )}
                </div>

                {!canSubmit && canDownloadDataset && (
                  <p className="text-sm text-text-tertiary mt-3">
                    {dailyLimitReached && 'Daily submission limit reached. '}
                    {totalLimitReached && 'Total submission limit reached. '}
                    {!dailyLimitReached && !totalLimitReached &&
                      (currentPhase === 'registration' ? 'Submissions open after registration phase. ' :
                       currentPhase === 'ended' ? 'Competition has ended. ' : '')}
                  </p>
                )}
              </Card>
            )}

            {/* Tabs: Overview / Leaderboard / My Submissions */}
            <CompetitionTabs
              competition={competition}
              leaderboard={leaderboard || []}
              isRegistered={registration?.status === 'approved'}
              userId={user?.id}
            />
          </div>

          {/* Sidebar - Right Column (1/3) */}
          <div className="space-y-6">
            {/* Phase Indicator */}
            <PhaseIndicator
              currentPhase={currentPhase}
              competitionType={competition.competition_type}
              phases={{
                registration: {
                  start: competition.registration_start,
                  end: competition.registration_end,
                },
                publicTest: {
                  start: competition.public_test_start,
                  end: competition.public_test_end,
                },
                ...(competition.competition_type === '4-phase' && competition.private_test_start && {
                  privateTest: {
                    start: competition.private_test_start,
                    end: competition.private_test_end || competition.private_test_start,
                  },
                }),
              }}
            />

            {/* Leaderboard Preview */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Top Participants
              </h3>

              {leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard?.slice(0, 5).map((entry: any, index: number) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-bg-elevated rounded-lg border border-border-default"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`
                          font-bold text-lg
                          ${index === 0 ? 'text-warning' : ''}
                          ${index === 1 ? 'text-text-secondary' : ''}
                          ${index === 2 ? 'text-phase-registration' : ''}
                          ${index > 2 ? 'text-text-tertiary' : ''}
                        `}>
                          #{index + 1}
                        </span>
                        <span className="text-sm text-text-secondary truncate">
                          {entry.users?.full_name || entry.users?.email?.split('@')[0] || 'Anonymous'}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-primary-blue">
                        {entry.score?.toFixed(4) || '0.0000'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-tertiary text-center py-8">
                  No submissions yet
                </p>
              )}
            </Card>

            {/* Submission Rules */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Submission Rules</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-1">•</span>
                  <span>Maximum {competition.daily_submission_limit || 5} submissions per day</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-1">•</span>
                  <span>Maximum file size: {competition.max_file_size_mb || 10}MB</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-1">•</span>
                  <span>CSV format required</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-1">•</span>
                  <span>Evaluated using {competition.scoring_metric || 'F1 Score'}</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
