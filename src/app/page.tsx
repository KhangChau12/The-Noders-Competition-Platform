import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import CompetitionCard from '@/components/competition/CompetitionCard';
import { createClient } from '@/lib/supabase/server';
import {
  Trophy,
  Users,
  Target,
  TrendingUp,
  Zap,
  Award,
  BarChart3,
  Clock,
  ArrowRight,
  Code2,
  Brain,
  Sparkles,
} from 'lucide-react';

// Helper function to calculate competition phase
function getCompetitionPhase(competition: any): 'upcoming' | 'registration' | 'public_test' | 'private_test' | 'ended' {
  const now = new Date();
  const regStart = new Date(competition.registration_start);
  const regEnd = new Date(competition.registration_end);
  const publicStart = new Date(competition.public_test_start);
  const publicEnd = new Date(competition.public_test_end);
  const privateStart = competition.private_test_start ? new Date(competition.private_test_start) : null;
  const privateEnd = competition.private_test_end ? new Date(competition.private_test_end) : null;

  if (now < regStart) return 'upcoming';
  if (now >= regStart && now < regEnd) return 'registration';
  if (now >= publicStart && now < publicEnd) return 'public_test';
  if (privateStart && privateEnd && now >= privateStart && now < privateEnd) return 'private_test';
  return 'ended';
}

// Helper function to calculate days remaining
function getDaysRemaining(competition: any): number {
  const now = new Date();
  const phase = getCompetitionPhase(competition);

  let endDate: Date;
  switch (phase) {
    case 'registration':
      endDate = new Date(competition.registration_end);
      break;
    case 'public_test':
      endDate = new Date(competition.public_test_end);
      break;
    case 'private_test':
      endDate = competition.private_test_end ? new Date(competition.private_test_end) : new Date();
      break;
    default:
      return 0;
  }

  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch featured competitions (registration open)
  const { data: featuredCompetitions } = await supabase
    .from('competitions')
    .select('*')
    .is('deleted_at', null)
    .gte('registration_end', new Date().toISOString())
    .lte('registration_start', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(3);

  // Fetch all competitions for preview
  const { data: allCompetitions } = (await supabase
    .from('competitions')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(6)) as { data: any };

  // Fetch statistics
  const { count: totalCompetitions } = await supabase
    .from('competitions')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  // Fetch total unique participants from view (bypasses RLS)
  const { data: totalParticipantsData } = (await supabase
    .from('total_participants_count')
    .select('total_count')
    .single()) as { data: { total_count: number } | null };

  const totalParticipants = totalParticipantsData?.total_count || 0;

  const { count: totalSubmissions } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true });

  // Fetch participant counts from public view (bypasses RLS)
  const { data: participantCountsData } = await supabase
    .from('competition_participant_counts')
    .select('competition_id, participant_count');

  const participantCountsMap = (participantCountsData || []).reduce(
    (acc, item: any) => {
      acc[item.competition_id] = item.participant_count;
      return acc;
    },
    {} as Record<string, number>
  );

  // Get participants and submissions count for each competition
  const competitionsWithStats = await Promise.all(
    (featuredCompetitions || []).map(async (competition: any) => {
      const { count: submissions } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('competition_id', competition.id);

      return {
        competition,
        stats: {
          participants: participantCountsMap[competition.id] || 0,
          submissions: submissions || 0,
          daysRemaining: getDaysRemaining(competition),
        },
      };
    })
  );

  return (
    <main className="min-h-screen">
      {/* Hero Section with Tech Grid Background */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-24 lg:py-28">
        {/* Animated Tech Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(51,65,85,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(51,65,85,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-blue/5 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            {/* Sparkles Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-accent-cyan animate-pulse" />
                <div className="absolute inset-0 blur-xl bg-accent-cyan/30 animate-pulse" />
              </div>
            </div>

            {/* Main Heading with Gradient */}
            <h1 className="font-extrabold text-4xl sm:text-6xl lg:text-7xl mb-6 leading-tight">
              <span className="text-text-primary">
                Competition Platform
              </span>
              <br />
              <span className="bg-gradient-brand bg-clip-text text-transparent">
                AI & Machine Learning
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
              Join The Noders PTNK community - Challenge yourself with real-world AI competitions,
              compete fairly and learn from the community.
            </p>

            {/* Value Props */}
            <div className="flex flex-wrap gap-4 justify-center mb-12 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-bg-surface/50 rounded-full border border-border-default">
                <Trophy className="w-4 h-4 text-accent-cyan" />
                <span>High-Quality Competitions</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-bg-surface/50 rounded-full border border-border-default">
                <Users className="w-4 h-4 text-accent-cyan" />
                <span>Professional Community</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-bg-surface/50 rounded-full border border-border-default">
                <Target className="w-4 h-4 text-accent-cyan" />
                <span>Real-World Problems</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/competitions">
                <Button variant="primary" size="lg" className="gap-2">
                  <Trophy className="w-5 h-5" />
                  View Competitions
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="lg" className="gap-2">
                  Sign Up Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Quick Stats - Professional Cards */}
            <div className="mt-16 grid grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="bg-bg-surface/80 backdrop-blur-sm border border-border-default rounded-2xl p-6 hover:border-accent-cyan/50 transition-all">
                <div className="flex items-center justify-center mb-3">
                  <Trophy className="w-8 h-8 text-accent-cyan" />
                </div>
                <div className="text-4xl font-bold text-transparent bg-gradient-brand bg-clip-text font-mono text-center">
                  {totalCompetitions || 0}
                </div>
                <div className="text-sm text-text-secondary mt-2 text-center font-medium">
                  Competitions
                </div>
              </div>
              <div className="bg-bg-surface/80 backdrop-blur-sm border border-border-default rounded-2xl p-6 hover:border-primary-blue/50 transition-all">
                <div className="flex items-center justify-center mb-3">
                  <Users className="w-8 h-8 text-primary-blue" />
                </div>
                <div className="text-4xl font-bold text-transparent bg-gradient-brand bg-clip-text font-mono text-center">
                  {totalParticipants || 0}+
                </div>
                <div className="text-sm text-text-secondary mt-2 text-center font-medium">
                  Participants
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Competitions Section */}
      {featuredCompetitions && featuredCompetitions.length > 0 && (
        <section className="px-6 py-12 sm:py-16 max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className="w-8 h-8 text-accent-cyan" />
              <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary">
                Featured Competitions
              </h2>
            </div>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Register now to join open competitions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {competitionsWithStats.map(({ competition, stats }) => (
              <CompetitionCard
                key={competition.id}
                competition={competition}
                phase={getCompetitionPhase(competition)}
                stats={stats}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/competitions">
              <Button variant="outline" size="lg" className="gap-2">
                View All Competitions
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* All Competitions Preview */}
      {allCompetitions && allCompetitions.length > 0 && (
        <section className="px-6 py-12 sm:py-16 bg-bg-surface/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary mb-3">
                All Competitions
              </h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Explore ongoing, upcoming, and completed competitions
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {allCompetitions?.slice(0, 6).map((competition: any) => (
                <CompetitionCard
                  key={competition.id}
                  competition={competition}
                  phase={getCompetitionPhase(competition)}
                />
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/competitions">
                <Button variant="primary" size="lg" className="gap-2">
                  Explore All
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="px-6 py-12 sm:py-16 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Brain className="w-8 h-8 text-accent-cyan" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary">
              How It Works
            </h2>
          </div>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Get started in just 3 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {/* Step 1 */}
          <div className="relative">
            <Card className="p-8 text-center h-full hover:border-primary-blue transition-all duration-300 hover:shadow-lg hover:shadow-primary-blue/10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-brand mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="absolute top-4 right-4 text-6xl font-bold text-text-tertiary/10 font-mono">
                01
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-4">
                Create Account
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Create an account and register for competitions you're interested in.
                Join individually or as a team.
              </p>
            </Card>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <Card className="p-8 text-center h-full hover:border-primary-blue transition-all duration-300 hover:shadow-lg hover:shadow-primary-blue/10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-brand mb-6">
                <Code2 className="w-8 h-8 text-white" />
              </div>
              <div className="absolute top-4 right-4 text-6xl font-bold text-text-tertiary/10 font-mono">
                02
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-4">
                Build & Train
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Download data, build your AI model and train it
                to achieve the best results.
              </p>
            </Card>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <Card className="p-8 text-center h-full hover:border-primary-blue transition-all duration-300 hover:shadow-lg hover:shadow-primary-blue/10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-brand mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="absolute top-4 right-4 text-6xl font-bold text-text-tertiary/10 font-mono">
                03
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-4">
                Submit & Compete
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Submit your predictions, get instant feedback and climb
                the leaderboard to win.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Statistics Section */}
      <section className="px-6 py-12 sm:py-16 bg-bg-surface/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <BarChart3 className="w-8 h-8 text-accent-cyan" />
              <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary">
                Platform Statistics
              </h2>
            </div>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Join our thriving AI community
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Total Competitions */}
            <Card className="p-6 text-center hover:border-primary-blue transition-all duration-300">
              <Trophy className="w-12 h-12 text-accent-cyan mx-auto mb-4" />
              <div className="text-4xl font-bold text-transparent bg-gradient-brand bg-clip-text font-mono mb-2">
                {totalCompetitions || 0}
              </div>
              <div className="text-sm text-text-tertiary uppercase tracking-wider">
                Total Competitions
              </div>
            </Card>

            {/* Total Participants */}
            <Card className="p-6 text-center hover:border-primary-blue transition-all duration-300">
              <Users className="w-12 h-12 text-accent-cyan mx-auto mb-4" />
              <div className="text-4xl font-bold text-transparent bg-gradient-brand bg-clip-text font-mono mb-2">
                {totalParticipants || 0}+
              </div>
              <div className="text-sm text-text-tertiary uppercase tracking-wider">
                Total Participants
              </div>
            </Card>

            {/* Total Submissions */}
            <Card className="p-6 text-center hover:border-primary-blue transition-all duration-300">
              <Target className="w-12 h-12 text-accent-cyan mx-auto mb-4" />
              <div className="text-4xl font-bold text-transparent bg-gradient-brand bg-clip-text font-mono mb-2">
                {totalSubmissions || 0}
              </div>
              <div className="text-sm text-text-tertiary uppercase tracking-wider">
                Total Submissions
              </div>
            </Card>

            {/* Avg Response Time (placeholder) */}
            <Card className="p-6 text-center hover:border-primary-blue transition-all duration-300">
              <Clock className="w-12 h-12 text-accent-cyan mx-auto mb-4" />
              <div className="text-4xl font-bold text-transparent bg-gradient-brand bg-clip-text font-mono mb-2">
                &lt;1s
              </div>
              <div className="text-sm text-text-tertiary uppercase tracking-wider">
                Scoring Speed
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-6 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center bg-gradient-to-br from-bg-surface to-bg-elevated border-primary-blue/20 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />

            <div className="relative">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-brand mb-6">
                <Award className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
                <span className="bg-gradient-brand bg-clip-text text-transparent">
                  Ready for the Challenge?
                </span>
              </h2>

              <p className="text-lg sm:text-xl text-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
                Join thousands of data scientists and ML engineers in exciting AI challenges.
                Start your journey today!
              </p>

              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/signup">
                  <Button variant="primary" size="lg" className="gap-2">
                    <Zap className="w-5 h-5" />
                    Sign Up Now
                  </Button>
                </Link>
                <Link href="/competitions">
                  <Button variant="outline" size="lg" className="gap-2">
                    <Trophy className="w-5 h-5" />
                    View Competitions
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
