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

  return (
    <main className="min-h-screen">
      {/* Hero Section with Split Screen Design */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-bg-primary py-24 lg:py-24">
        {/* Background: Blurred glow orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary-blue/20 rounded-full blur-[120px] pointer-events-none opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent-cyan/20 rounded-full blur-[120px] pointer-events-none opacity-60" />
        
        {/* Grid Background Overlay */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(51,65,85,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(51,65,85,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-8 items-center relative z-10">
          {/* Left Column - Typography & CTA */}
          <div className="text-center lg:text-left pt-6 lg:pt-0 lg:-ml-12">
            <h1 className="font-brand text-4xl lg:text-5xl leading-tight mb-4">
              <span className="text-text-primary block mb-1">
                The Noders
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-brand">
                Competition Platform
              </span>
            </h1>

            <p className="text-lg lg:text-xl font-light text-text-secondary mb-6 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Join <span className="font-brand text-primary-blue">The Noders PTNK</span> community. Challenge yourself with real-world AI competitions,
              compete fairly and learn from the best.
            </p>

            {/* Value Props */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-6 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface/50 rounded-full border border-border-default/50 backdrop-blur-sm">
                <Trophy className="w-4 h-4 text-accent-cyan" />
                <span>High-Quality Competitions</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface/50 rounded-full border border-border-default/50 backdrop-blur-sm">
                <Users className="w-4 h-4 text-accent-cyan" />
                <span>Professional Community</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 justify-center lg:justify-start flex-wrap">
              <Link href="/competitions">
                <Button variant="primary" size="lg" className="gap-2 shadow-lg shadow-primary-blue/20">
                  <Trophy className="w-5 h-5" />
                  View Competitions
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="lg" className="gap-2 backdrop-blur-sm bg-bg-primary/50">
                  Sign Up Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

           {/* Right Column - The Floating Constellation */}
           <div className="relative h-[400px] lg:h-[500px] w-full hidden lg:block select-none pointer-events-none mt-6">
            <div className="relative w-full h-full [perspective:1000px] flex items-center justify-center">
               {/* Center Hub: Main Dashboard - Anchor */}
               <div className="w-[85%] lg:w-[80%] z-20 animate-levitate shadow-2xl shadow-primary-blue/10 rounded-xl border border-white/10 overflow-hidden bg-bg-surface/80 backdrop-blur-md relative">
                   {/* Main Dashboard Image - Auto Height based on image ratio */}
                   <div className="w-full flex items-center justify-center relative overflow-hidden group">
                        <img src="/hero-images/dashboard.png" alt="Main Dashboard" className="w-full h-auto object-contain" />
                   </div>
               </div>

               {/* Foreground: Feature Card 1 - Top Left */}
               <div className="absolute top-[-15%] left-[0%] lg:-left-[15%] w-[45%] z-30 animate-levitate [animation-delay:1.5s] shadow-2xl shadow-black/50 rounded-lg border border-white/10 overflow-hidden bg-bg-surface">
                   <div className="w-full flex items-center justify-center relative overflow-hidden">
                        <img src="/hero-images/feature-1.png" alt="Feature 1" className="w-full h-auto object-contain" />
                   </div>
               </div>

               {/* Foreground: Feature Card 2 - Bottom Right */}
               <div className="absolute bottom-[5%] right-[0%] lg:-right-[5%] w-[35%] z-30 animate-levitate [animation-delay:2.5s] shadow-2xl shadow-black/50 rounded-lg border border-white/10 overflow-hidden bg-bg-surface">
                    <div className="w-full flex items-center justify-center relative overflow-hidden">
                        <img src="/hero-images/feature-2.png" alt="Feature 2" className="w-full h-auto object-contain" />
                   </div>
               </div>

               {/* Background: Feature Card 3 - Top Right (New) */}
               <div className="absolute -top-[5%] right-[0%] lg:-right-[2%] w-[28%] z-10 animate-levitate [animation-delay:0.5s] shadow-xl rounded-lg border border-white/5 overflow-hidden bg-bg-surface">
                   <div className="w-full flex items-center justify-center relative overflow-hidden">
                        <img src="/hero-images/feature-3.png" alt="Feature 3" className="w-full h-auto object-contain" />
                   </div>
               </div>

               {/* Background: Feature Card 4 - Bottom Left (New) */}
               <div className="absolute -bottom-[5%] left-[0%] lg:-left-[2%] w-[30%] z-10 animate-levitate [animation-delay:3.5s] shadow-xl rounded-lg border border-white/5 overflow-hidden bg-bg-surface">
                    <div className="w-full flex items-center justify-center relative overflow-hidden">
                        <img src="/hero-images/feature-4.png" alt="Feature 4" className="w-full h-auto object-contain" />
                   </div>
               </div>
            </div>
          </div>
        </div>
      </section>

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
              <h3 className="text-xl font-semibold text-text-primary mb-4">
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
              <h3 className="text-xl font-semibold text-text-primary mb-4">
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
              <h3 className="text-xl font-semibold text-text-primary mb-4">
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
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="gradient-text">
                  Ready for the Challenge?
                </span>
              </h2>

              <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
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
