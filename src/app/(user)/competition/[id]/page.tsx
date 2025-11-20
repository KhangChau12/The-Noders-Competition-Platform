import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import CountdownTimer from '@/components/competition/CountdownTimer';
import PhaseIndicator from '@/components/competition/PhaseIndicator';
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
  Upload,
  BarChart3,
  FileText,
  Database,
  TrendingUp,
} from 'lucide-react';

interface CompetitionPageProps {
  params: {
    id: string;
  };
}

// Helper function to determine current phase
function getCurrentPhase(competition: any): 'upcoming' | 'registration' | 'public_test' | 'private_test' | 'ended' {
  const now = new Date();
  const registrationStart = new Date(competition.registration_start);
  const registrationEnd = new Date(competition.registration_end);
  const publicTestEnd = new Date(competition.public_test_end);
  const privateTestEnd = competition.private_test_end ? new Date(competition.private_test_end) : null;

  if (now < registrationStart) return 'upcoming';
  if (now >= registrationStart && now < registrationEnd) return 'registration';
  if (now >= registrationEnd && now < publicTestEnd) return 'public_test';
  if (privateTestEnd && now < privateTestEnd) return 'private_test';
  return 'ended';
}

// Helper function to get next deadline
function getNextDeadline(competition: any, currentPhase: string): Date | null {
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

export default async function CompetitionPage({ params }: CompetitionPageProps) {
  const { id } = params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/competitions/${id}`);
  }

  // Fetch competition details
  const { data: competition } = (await supabase
    .from('competitions')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()) as { data: any };

  if (!competition) {
    redirect('/competitions');
  }

  // Check user's registration status
  const { data: registration } = (await supabase
    .from('registrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('competition_id', id)
    .single()) as { data: any };

  // Get user's best submission
  const { data: bestSubmission } = (await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .eq('competition_id', id)
    .eq('is_best_score', true)
    .single()) as { data: any };

  // Get user's recent submissions
  const { data: recentSubmissions } = (await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .eq('competition_id', id)
    .order('created_at', { ascending: false })
    .limit(5)) as { data: any };

  // Get user's rank (individual)
  const { count: betterCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('competition_id', id)
    .eq('is_best_score', true)
    .gt('score', bestSubmission?.score || 0);

  const userRank = bestSubmission ? (betterCount || 0) + 1 : null;

  // Get total participants count
  const { count: totalParticipants } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('competition_id', id)
    .eq('status', 'approved');

  // Get leaderboard (top 10)
  const { data: leaderboard } = (await supabase
    .from('submissions')
    .select(`
      *,
      users!submissions_user_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('competition_id', id)
    .eq('is_best_score', true)
    .order('score', { ascending: false })
    .limit(10)) as { data: any };

  // Determine current phase
  const currentPhase = getCurrentPhase(competition);
  const nextDeadline = getNextDeadline(competition, currentPhase);
  const countdownLabel = getCountdownLabel(currentPhase);

  // Phase configuration
  const phases = {
    registration: {
      start: competition.registration_start,
      end: competition.registration_end,
    },
    publicTest: {
      start: competition.public_test_start,
      end: competition.public_test_end,
    },
    ...(competition.private_test_start && {
      privateTest: {
        start: competition.private_test_start,
        end: competition.private_test_end,
      },
    }),
  };

  const competitionType = competition.competition_type === '4phase' ? '4-phase' : '3-phase';
  const isIndividual = competition.participation_type === 'individual';

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-blue transition-colors mb-4"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{competition.title}</h1>
              <p className="text-text-secondary">{competition.description}</p>
            </div>
            <Badge variant={isIndividual ? 'blue' : 'purple'}>
              {isIndividual ? 'Individual' : 'Team'}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Registration Status */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Registration Status</h2>

              {!registration && (
                <div className="flex items-start gap-4 p-4 bg-bg-elevated rounded-lg border border-border-default">
                  <AlertCircle className="w-6 h-6 text-warning flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-warning mb-2">Not Registered</h3>
                    <p className="text-text-secondary mb-4">
                      You need to register for this competition before you can participate.
                    </p>
                    <Link href={`/competition/${id}/register`}>
                      <Button variant="primary">Register Now</Button>
                    </Link>
                  </div>
                </div>
              )}

              {registration?.status === 'pending' && (
                <div className="flex items-start gap-4 p-4 bg-bg-elevated rounded-lg border border-warning/30">
                  <Clock className="w-6 h-6 text-warning flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-warning mb-2">Registration Pending</h3>
                    <p className="text-text-secondary">
                      Your registration is pending admin approval. You'll be able to submit once approved.
                    </p>
                  </div>
                </div>
              )}

              {registration?.status === 'approved' && (
                <div className="flex items-start gap-4 p-4 bg-bg-elevated rounded-lg border border-success/30">
                  <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-success mb-2">Registration Approved</h3>
                    <p className="text-text-secondary mb-4">
                      You're all set! You can now access the dataset, submit solutions, and compete.
                    </p>
                  </div>
                </div>
              )}

              {registration?.status === 'rejected' && (
                <div className="flex items-start gap-4 p-4 bg-bg-elevated rounded-lg border border-error/30">
                  <XCircle className="w-6 h-6 text-error flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-error mb-2">Registration Rejected</h3>
                    <p className="text-text-secondary">
                      Your registration was not approved. Please contact the organizers for more information.
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* Quick Actions - Only for approved users */}
            {registration?.status === 'approved' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Link href={`/competition/${id}/submit`}>
                    <Button variant="primary" className="w-full gap-2">
                      <Upload className="w-4 h-4" />
                      Submit Solution
                    </Button>
                  </Link>

                  {competition.dataset_url && (
                    <a
                      href={competition.dataset_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="secondary" className="w-full gap-2">
                        <Database className="w-4 h-4" />
                        View Dataset
                      </Button>
                    </a>
                  )}

                  <Link href={`/competitions/${id}#description`}>
                    <Button variant="outline" className="w-full gap-2">
                      <FileText className="w-4 h-4" />
                      Competition Details
                    </Button>
                  </Link>

                  <Link href={`/competitions/${id}#leaderboard`}>
                    <Button variant="outline" className="w-full gap-2">
                      <Trophy className="w-4 h-4" />
                      Full Leaderboard
                    </Button>
                  </Link>
                </div>
              </Card>
            )}

            {/* Performance Overview */}
            {registration?.status === 'approved' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Your Performance</h2>

                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-bg-elevated rounded-lg">
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-warning" />
                    <div className="text-3xl font-bold text-warning mb-1">
                      {userRank ? `#${userRank}` : '-'}
                    </div>
                    <div className="text-sm text-text-tertiary">
                      Current Rank
                      {totalParticipants && <span className="text-xs block">of {totalParticipants}</span>}
                    </div>
                  </div>

                  <div className="text-center p-4 bg-bg-elevated rounded-lg">
                    <Target className="w-8 h-8 mx-auto mb-2 text-primary-blue" />
                    <div className="text-3xl font-bold text-primary-blue mb-1">
                      {bestSubmission?.score?.toFixed(4) || '-'}
                    </div>
                    <div className="text-sm text-text-tertiary">Best Score</div>
                  </div>

                  <div className="text-center p-4 bg-bg-elevated rounded-lg">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-success" />
                    <div className="text-3xl font-bold text-success mb-1">
                      {recentSubmissions?.length || 0}
                    </div>
                    <div className="text-sm text-text-tertiary">Total Submissions</div>
                  </div>
                </div>

                {/* Recent Submissions */}
                {recentSubmissions && recentSubmissions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4">Recent Submissions</h3>
                    <div className="space-y-2">
                      {recentSubmissions.map((submission: any, index: number) => (
                        <div
                          key={submission.id}
                          className="flex items-center justify-between p-3 bg-bg-elevated rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-text-tertiary">#{index + 1}</span>
                            <div>
                              <div className="text-sm font-medium">
                                {new Date(submission.created_at).toLocaleString()}
                              </div>
                              <div className="text-xs text-text-tertiary">
                                Phase: {submission.phase}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-primary-blue">
                              {submission.score?.toFixed(4)}
                            </div>
                            {submission.is_best_score && (
                              <Badge variant="yellow" className="text-xs">Best</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!recentSubmissions || recentSubmissions.length === 0) && (
                  <div className="text-center py-8">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-text-tertiary" />
                    <p className="text-text-tertiary mb-4">No submissions yet</p>
                    <Link href={`/competition/${id}/submit`}>
                      <Button variant="primary">Make Your First Submission</Button>
                    </Link>
                  </div>
                )}
              </Card>
            )}

            {/* Leaderboard Preview - Individual only */}
            {registration?.status === 'approved' && isIndividual && leaderboard && leaderboard.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Leaderboard (Top 10)</h2>
                  <Link href={`/competitions/${id}#leaderboard`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      View Full
                      <TrendingUp className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>

                <div className="space-y-2">
                  {leaderboard.map((entry: any, index: number) => {
                    const isCurrentUser = entry.user_id === user.id;
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          isCurrentUser
                            ? 'bg-primary-blue/10 border border-primary-blue/30'
                            : 'bg-bg-elevated hover:bg-bg-surface'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              index === 0
                                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                                : index === 1
                                ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                                : index === 2
                                ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                                : 'bg-bg-surface'
                            }`}
                          >
                            <span className="font-bold text-sm">#{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {entry.users?.full_name || 'Anonymous'}
                              {isCurrentUser && (
                                <Badge variant="blue" className="ml-2 text-xs">You</Badge>
                              )}
                            </div>
                            <div className="text-xs text-text-tertiary truncate">
                              {entry.users?.email}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="font-mono font-bold text-lg text-primary-blue">
                            {entry.score?.toFixed(4)}
                          </div>
                          <div className="text-xs text-text-tertiary uppercase">
                            {competition.scoring_metric}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Show user's position if not in top 10 */}
                {!leaderboard?.some((entry: any) => entry.user_id === user.id) && userRank && userRank > 10 && (
                  <div className="mt-4 pt-4 border-t border-border-default">
                    <div className="flex items-center justify-between p-3 bg-primary-blue/10 border border-primary-blue/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-bg-surface rounded-full flex items-center justify-center">
                          <span className="font-bold text-sm">#{userRank}</span>
                        </div>
                        <div>
                          <div className="font-medium">Your Position</div>
                          <div className="text-xs text-text-tertiary">Keep climbing!</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-lg text-primary-blue">
                          {bestSubmission?.score?.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Team Leaderboard Note */}
            {registration?.status === 'approved' && !isIndividual && (
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Users className="w-6 h-6 text-primary-blue flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-primary-blue mb-2">Team Competition</h3>
                    <p className="text-text-secondary mb-4">
                      This is a team-based competition. View the full team leaderboard to see how your team ranks.
                    </p>
                    <Link href={`/competitions/${id}#leaderboard`}>
                      <Button variant="outline" className="gap-2">
                        <Trophy className="w-4 h-4" />
                        View Team Leaderboard
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Countdown */}
            {nextDeadline && currentPhase !== 'ended' && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4 text-center">{countdownLabel}</h3>
                <CountdownTimer targetDate={nextDeadline} />
              </Card>
            )}

            {/* Phase Indicator */}
            <PhaseIndicator
              currentPhase={currentPhase}
              competitionType={competitionType}
              phases={phases}
            />

            {/* Competition Stats */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Competition Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Type:</span>
                  <Badge variant={isIndividual ? 'blue' : 'purple'}>
                    {competition.participation_type}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Metric:</span>
                  <span className="font-medium uppercase">{competition.scoring_metric}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Daily Limit:</span>
                  <span className="font-medium">{competition.daily_submission_limit} submissions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Max File Size:</span>
                  <span className="font-medium">{competition.max_file_size_mb} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Participants:</span>
                  <span className="font-medium">{totalParticipants || 0}</span>
                </div>
              </div>
            </Card>

            {/* Download Dataset */}
            {registration?.status === 'approved' && competition.dataset_url && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Dataset</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Download the competition dataset to start building your solution.
                </p>
                <a
                  href={competition.dataset_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="primary" className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Download Dataset
                  </Button>
                </a>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
