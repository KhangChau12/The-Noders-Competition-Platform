import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import CompetitionCard from '@/components/competition/CompetitionCard';
import Link from 'next/link';
import {
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Users,
  Award,
  Clock,
} from 'lucide-react';
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

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's registrations with competitions
  const { data: registrations, error: regError } = await supabase
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

  if (regError) {
    console.error('Error fetching registrations:', regError);
  }

  console.log('Dashboard Debug - User ID:', user.id);
  console.log('Dashboard Debug - Registrations:', registrations?.length || 0);
  console.log('Dashboard Debug - Registrations data:', JSON.stringify(registrations, null, 2));

  // Fetch total submissions count (show all, not just valid)
  const { count: totalSubmissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (submissionsError) {
    console.error('Error fetching submissions count:', submissionsError);
  }
  console.log('Dashboard Debug - Total Submissions:', totalSubmissions);

  // Fetch ALL user's best scores with competition metric
  const { data: allBestSubmissions } = (await supabase
    .from('submissions')
    .select(`
      score,
      competition_id,
      competitions (
        scoring_metric
      )
    `)
    .eq('user_id', user.id)
    .eq('is_best_score', true)) as { data: any };

  // Calculate best rank across all competitions
  let bestRank = null;
  if (allBestSubmissions && allBestSubmissions.length > 0) {
    // Calculate rank for each submission, find the best one
    const ranksPromises = allBestSubmissions.map(async (submission: any) => {
      const metric = submission.competitions?.scoring_metric || 'f1_score';
      const metricInfo = SCORING_METRIC_INFO[metric as keyof typeof SCORING_METRIC_INFO];
      const isHigherBetter = metricInfo?.higher_is_better !== false;

      // Count better scores based on metric direction
      const query = supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('competition_id', submission.competition_id)
        .eq('is_best_score', true);

      const { count } = isHigherBetter
        ? await query.gt('score', submission.score)
        : await query.lt('score', submission.score);

      return (count || 0) + 1;
    });

    const ranks = await Promise.all(ranksPromises);
    bestRank = Math.min(...ranks); // Get the best (lowest) rank
  }

  // Fetch ALL active competitions (not just registered ones)
  const { data: allCompetitions } = (await supabase
    .from('competitions')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })) as { data: any };

  // Create map of competition_id -> registration status
  const registrationStatusMap = new Map(
    registrations?.map((r: any) => [r.competition_id, r.status]) || []
  );

  // Separate into registered and not registered
  const registeredCompetitions = allCompetitions?.filter(
    (comp: any) => registrationStatusMap.has(comp.id)
  ) || [];
  const recommendedCompetitions = allCompetitions?.filter(
    (comp: any) => !registrationStatusMap.has(comp.id)
  ) || [];

  // Separate competitions by status
  const myRegisteredCompetitions = registrations?.filter(
    (r: any) => r.status === 'approved' && r.competitions
  );
  const pendingCompetitions = registrations?.filter((r: any) => r.status === 'pending');

  // Count ACTIVE competitions (ongoing: registration or public_test phase)
  const now = new Date();
  const activeCompetitionsCount = allCompetitions?.filter((comp: any) => {
    const phase = getCompetitionPhase(comp, now);
    return phase === 'registration' || phase === 'public_test' || phase === 'private_test';
  }).length || 0;

  console.log('Dashboard Debug - Active Competitions Count:', activeCompetitionsCount);
  console.log('Dashboard Debug - My Registered:', myRegisteredCompetitions?.length || 0);
  console.log('Dashboard Debug - Pending Competitions:', pendingCompetitions?.length || 0);
  console.log('Dashboard Debug - Registration Status Map:', Array.from(registrationStatusMap.entries()));

  // Fetch participant counts from public view (bypasses RLS)
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

  // Process competitions with phase and stats
  const processActiveCompetitions = (regs: any[]): CompetitionWithStats[] => {
    return regs
      .map((reg: any) => {
        const comp = reg.competitions as Competition;
        if (!comp) return null;

        const phase = getCompetitionPhase(comp, now);
        const countdown = getCountdown(comp, phase, now);

        return {
          ...comp,
          phase,
          participant_count: participantCounts[comp.id] || 0,
          registration_status: reg.status as 'approved' | 'pending' | 'rejected',
          countdown,
        };
      })
      .filter(Boolean) as CompetitionWithStats[];
  };

  const processRecommendedCompetitions = (comps: any[]): CompetitionWithStats[] => {
    return comps.map((comp: Competition) => {
      const phase = getCompetitionPhase(comp, now);
      const countdown = getCountdown(comp, phase, now);

      return {
        ...comp,
        phase,
        participant_count: participantCounts[comp.id] || 0,
        registration_status: 'not_registered' as const,
        countdown,
      };
    });
  };

  // Process ALL competitions with phase info
  const processAllCompetitions = (comps: any[]): CompetitionWithStats[] => {
    return comps.map((comp: Competition) => {
      const phase = getCompetitionPhase(comp, now);
      const countdown = getCountdown(comp, phase, now);

      // Get registration status from map
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

  const processedActiveCompetitions = myRegisteredCompetitions
    ? processActiveCompetitions(myRegisteredCompetitions)
    : [];
  const processedAllCompetitions = allCompetitions
    ? processAllCompetitions(allCompetitions)
    : [];
  const processedRecommendedCompetitions = recommendedCompetitions
    ? processRecommendedCompetitions(recommendedCompetitions)
    : [];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-shrikhand text-4xl md:text-5xl mb-2 gradient-text">Dashboard</h1>
          <p className="text-lg text-text-secondary">Welcome back! Here's your competition overview.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 border-l-4 border-primary-blue">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Active Competitions</div>
              <Trophy className="w-5 h-5 text-primary-blue" />
            </div>
            <div className="text-3xl font-bold text-primary-blue">
              {activeCompetitionsCount}
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-accent-cyan">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Total Submissions</div>
              <Target className="w-5 h-5 text-accent-cyan" />
            </div>
            <div className="text-3xl font-bold text-accent-cyan">{totalSubmissions || 0}</div>
          </Card>

          <Card className="p-6 border-l-4 border-warning">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Best Rank</div>
              <Award className="w-5 h-5 text-warning" />
            </div>
            <div className="text-3xl font-bold text-warning">
              {bestRank ? `#${bestRank}` : '-'}
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-success">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Pending Approvals</div>
              <Clock className="w-5 h-5 text-success" />
            </div>
            <div className="text-3xl font-bold text-success">
              {pendingCompetitions?.length || 0}
            </div>
          </Card>
        </div>

        {/* All Competitions with Timeline */}
        {processedAllCompetitions.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary flex items-center gap-2">
                <TrendingUp className="w-7 h-7 text-primary-blue" />
                All Competitions
              </h2>
              <Link href="/competitions">
                <Button variant="outline" size="sm">
                  Browse All
                </Button>
              </Link>
            </div>

            {/* Timeline View */}
            <div className="mb-8 space-y-4">
              {processedAllCompetitions.map((competition) => {
                const now = new Date();
                const regStart = new Date(competition.registration_start);
                const regEnd = new Date(competition.registration_end);
                const publicStart = new Date(competition.public_test_start);
                const publicEnd = new Date(competition.public_test_end);
                const privateStart = competition.private_test_start ? new Date(competition.private_test_start) : null;
                const privateEnd = competition.private_test_end ? new Date(competition.private_test_end) : null;

                const totalDuration = (privateEnd || publicEnd).getTime() - regStart.getTime();
                const elapsed = now.getTime() - regStart.getTime();
                const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

                return (
                  <Link key={competition.id} href={`/competitions/${competition.id}`}>
                    <Card className="p-6 hover:border-primary-blue/50 transition-all cursor-pointer">
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-text-primary mb-1">
                              {competition.title}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant={
                                  competition.phase === 'registration' ? 'purple' :
                                  competition.phase === 'public_test' ? 'blue' :
                                  competition.phase === 'private_test' ? 'cyan' : 'gray'
                                }
                              >
                                {competition.phase === 'registration' ? 'Registration' :
                                 competition.phase === 'public_test' ? 'Public Test' :
                                 competition.phase === 'private_test' ? 'Private Test' : 'Ended'}
                              </Badge>

                              {/* Registration Status Badge */}
                              {competition.phase !== 'ended' && (
                                <Badge
                                  variant={
                                    competition.registration_status === 'approved' ? 'green' :
                                    competition.registration_status === 'pending' ? 'yellow' :
                                    competition.registration_status === 'rejected' ? 'red' : 'gray'
                                  }
                                >
                                  {competition.registration_status === 'approved' ? '✓ Registered' :
                                   competition.registration_status === 'pending' ? '⏳ Pending' :
                                   competition.registration_status === 'rejected' ? '✗ Rejected' : 'Not Registered'}
                                </Badge>
                              )}

                              {competition.countdown && (
                                <span className="text-sm text-text-secondary">
                                  {competition.countdown.label}: {competition.countdown.days}d {competition.countdown.hours}h {competition.countdown.minutes}m
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                    {/* Timeline Bar */}
                    <div className="relative">
                      {/* Progress Bar */}
                      <div className="relative h-3 bg-bg-elevated rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-blue to-accent-cyan rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Timeline Markers */}
                      <div className="flex justify-between mt-3 text-xs">
                        <div className="flex flex-col items-start">
                          <span className="text-text-tertiary mb-1">Registration</span>
                          <span className="text-text-secondary font-semibold">
                            {regStart.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-text-tertiary mb-1">Public Test</span>
                          <span className="text-text-secondary font-semibold">
                            {publicStart.toLocaleDateString()}
                          </span>
                        </div>
                        {privateStart && (
                          <div className="flex flex-col items-center">
                            <span className="text-text-tertiary mb-1">Private Test</span>
                            <span className="text-text-secondary font-semibold">
                              {privateStart.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col items-end">
                          <span className="text-text-tertiary mb-1">End</span>
                          <span className="text-text-secondary font-semibold">
                            {(privateEnd || publicEnd).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

          </div>
        )}

        {/* Pending Approvals */}
        {pendingCompetitions && pendingCompetitions.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <Clock className="w-7 h-7 text-warning" />
              Pending Approvals
            </h2>

            <div className="space-y-4">
              {pendingCompetitions.map((registration: any) => {
                const comp = registration.competition;
                if (!comp) return null;

                return (
                  <Card
                    key={registration.id}
                    className="p-6 border-l-4 border-warning bg-warning/5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold">{comp.title}</h3>
                          <Badge variant="yellow">Pending</Badge>
                        </div>
                        <p className="text-text-secondary text-sm">
                          Your registration is being reviewed by administrators.
                        </p>
                      </div>
                      <Link href={`/competitions/${comp.id}`}>
                        <Button variant="outline" size="sm">
                          View Competition
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
