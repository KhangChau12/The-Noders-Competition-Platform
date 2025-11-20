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
  ArrowRight,
} from 'lucide-react';

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
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      *,
      competition:competitions (
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
    .order('created_at', { ascending: false });

  // Fetch total submissions count
  const { count: totalSubmissions } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Fetch best rank (from best scores in leaderboard)
  const { data: bestSubmission } = (await supabase
    .from('submissions')
    .select('score, competition_id')
    .eq('user_id', user.id)
    .eq('is_best_score', true)
    .order('score', { ascending: false })
    .limit(1)
    .single()) as { data: any };

  // Calculate best rank if user has submissions
  let bestRank = null;
  if (bestSubmission) {
    const { count: betterCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('competition_id', bestSubmission.competition_id)
      .eq('is_best_score', true)
      .gt('score', bestSubmission.score);

    bestRank = (betterCount || 0) + 1;
  }

  // Fetch competitions not yet registered for (recommendations)
  const { data: allCompetitions } = (await supabase
    .from('competitions')
    .select('*')
    .is('deleted_at', null)
    .gte('registration_end', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(6)) as { data: any };

  const registeredIds = new Set(
    registrations?.map((r: any) => r.competition?.id).filter(Boolean) || []
  );
  const recommendedCompetitions = allCompetitions?.filter(
    (comp: any) => !registeredIds.has(comp.id)
  );

  // Separate competitions by status
  const activeCompetitions = registrations?.filter(
    (r: any) => r.status === 'approved' && r.competition
  );
  const pendingCompetitions = registrations?.filter((r: any) => r.status === 'pending');

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
  const now = new Date();
  const processActiveCompetitions = (regs: any[]): CompetitionWithStats[] => {
    return regs
      .map((reg: any) => {
        const comp = reg.competition as Competition;
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

  const processedActiveCompetitions = activeCompetitions
    ? processActiveCompetitions(activeCompetitions)
    : [];
  const processedRecommendedCompetitions = recommendedCompetitions
    ? processRecommendedCompetitions(recommendedCompetitions)
    : [];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl sm:text-5xl mb-2 gradient-text">Dashboard</h1>
          <p className="text-text-secondary">Welcome back! Here's your competition overview.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 border-l-4 border-primary-blue">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Active Competitions</div>
              <Trophy className="w-5 h-5 text-primary-blue" />
            </div>
            <div className="text-3xl font-bold text-primary-blue">
              {activeCompetitions?.length || 0}
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

        {/* Active Competitions */}
        {activeCompetitions && activeCompetitions.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary-blue" />
                My Active Competitions
              </h2>
              <Link href="/competitions">
                <Button variant="outline" size="sm">
                  Browse All
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedActiveCompetitions.map((competition) => (
                <CompetitionCard
                  key={competition.id}
                  competition={competition}
                  phase={competition.phase}
                  stats={{ participants: competition.participant_count }}
                  countdown={competition.countdown}
                  registrationStatus={competition.registration_status}
                  showRegistrationBadge={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pending Approvals */}
        {pendingCompetitions && pendingCompetitions.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-warning" />
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

        {/* Recommended Competitions */}
        {recommendedCompetitions && recommendedCompetitions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-accent-cyan" />
              Recommended Competitions
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedRecommendedCompetitions.slice(0, 3).map((competition) => (
                <CompetitionCard
                  key={competition.id}
                  competition={competition}
                  phase={competition.phase}
                  stats={{ participants: competition.participant_count }}
                  countdown={competition.countdown}
                  registrationStatus={competition.registration_status}
                  showRegistrationBadge={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
