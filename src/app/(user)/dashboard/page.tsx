import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
        registration_end,
        public_test_end,
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
  const { data: bestSubmission } = await supabase
    .from('submissions')
    .select('score, competition_id')
    .eq('user_id', user.id)
    .eq('is_best_score', true)
    .order('score', { ascending: false })
    .limit(1)
    .single();

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
  const { data: allCompetitions } = await supabase
    .from('competitions')
    .select('*')
    .is('deleted_at', null)
    .gte('registration_end', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(6);

  const registeredIds = new Set(
    registrations?.map((r: any) => r.competition?.id).filter(Boolean) || []
  );
  const recommendedCompetitions = allCompetitions?.filter(
    (comp) => !registeredIds.has(comp.id)
  );

  // Separate competitions by status
  const activeCompetitions = registrations?.filter(
    (r: any) => r.status === 'approved' && r.competition
  );
  const pendingCompetitions = registrations?.filter((r: any) => r.status === 'pending');

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
              {activeCompetitions.map((registration: any) => {
                const comp = registration.competition;
                if (!comp) return null;

                // Determine current phase
                const now = new Date();
                const regEnd = new Date(comp.registration_end);
                const publicEnd = new Date(comp.public_test_end);
                const privateEnd = comp.private_test_end
                  ? new Date(comp.private_test_end)
                  : null;

                let phase = 'ended';
                let phaseVariant: any = 'ended';
                if (now < regEnd) {
                  phase = 'Registration';
                  phaseVariant = 'registration';
                } else if (now < publicEnd) {
                  phase = 'Public Test';
                  phaseVariant = 'public';
                } else if (privateEnd && now < privateEnd) {
                  phase = 'Private Test';
                  phaseVariant = 'private';
                } else {
                  phase = 'Ended';
                }

                return (
                  <Link key={registration.id} href={`/competitions/${comp.id}`}>
                    <Card className="p-6 hover:border-border-focus transition-all h-full flex flex-col">
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <Badge variant={phaseVariant}>{phase}</Badge>
                        <Badge variant="green">Registered</Badge>
                      </div>

                      <h3 className="text-xl font-bold mb-2 line-clamp-2">{comp.title}</h3>

                      <p className="text-text-secondary text-sm mb-4 line-clamp-2 flex-grow">
                        {comp.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-text-tertiary pt-4 border-t border-border-default">
                        <span className="flex items-center gap-1">
                          <Trophy className="w-4 h-4" />
                          {comp.scoring_metric || 'F1 Score'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
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
              {recommendedCompetitions.slice(0, 3).map((comp: any) => (
                <Link key={comp.id} href={`/competitions/${comp.id}`}>
                  <Card className="p-6 hover:border-border-focus transition-all h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="registration">Open for Registration</Badge>
                    </div>

                    <h3 className="text-xl font-bold mb-2 line-clamp-2">{comp.title}</h3>

                    <p className="text-text-secondary text-sm mb-4 line-clamp-3 flex-grow">
                      {comp.description}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!activeCompetitions || activeCompetitions.length === 0) &&
          (!pendingCompetitions || pendingCompetitions.length === 0) && (
            <Card className="p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
              <h3 className="text-xl font-bold mb-2">No Competitions Yet</h3>
              <p className="text-text-secondary mb-6">
                Start your AI journey by registering for a competition
              </p>
              <Link href="/competitions">
                <Button variant="primary" size="lg">
                  Browse Competitions
                </Button>
              </Link>
            </Card>
          )}
      </div>
    </div>
  );
}
