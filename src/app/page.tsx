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
              Join <span className="font-brand text-primary-blue">The Noders Community</span>. Challenge yourself with real-world AI competitions,
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
                   <div className="w-full flex items-center justify- relative overflow-hidden group">
                        <img src="/hero-images/dashboard.png" alt="Maincenter Dashboard" className="w-full h-auto object-contain" />
                   </div>
               </div>

               {/* Foreground: Feature Card 1 - Top Left */}
               <div className="absolute top-[-15%] left-[0%] lg:-left-[15%] w-[45%] z-10 animate-levitate [animation-delay:1.5s] shadow-2xl shadow-black/50 rounded-lg border border-white/10 overflow-hidden bg-bg-surface">
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
               <div className="absolute -top-[5%] right-[0%] lg:-right-[2%] w-[28%] z-30 animate-levitate [animation-delay:0.5s] shadow-xl rounded-lg border border-white/5 overflow-hidden bg-bg-surface">
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

      {/* Quick Statistics Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 bg-bg-surface/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <BarChart3 className="w-8 h-8 text-accent-cyan" />
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
                Platform Statistics
              </h2>
            </div>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              A quick snapshot of activity across the platform.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="group relative overflow-hidden rounded-2xl border border-border-default/60 bg-bg-surface/70 backdrop-blur-sm p-5 sm:p-6 shadow-lg shadow-black/10 hover:border-primary-blue/40 transition-all duration-300 min-h-[180px]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Trophy className="absolute -bottom-6 -right-6 h-24 w-24 text-primary-blue/10 pointer-events-none transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
              <div className="relative flex h-full flex-col justify-end pr-10 sm:pr-12">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-gradient-brand bg-clip-text font-mono mb-1 relative z-10">
                  {totalCompetitions || 0}
                </div>
                <div className="text-[10px] md:text-[11px] font-semibold text-text-secondary uppercase tracking-[0.14em] md:tracking-[0.18em] leading-tight relative z-10">
                  Total Competitions
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border-default/60 bg-bg-surface/70 backdrop-blur-sm p-5 sm:p-6 shadow-lg shadow-black/10 hover:border-primary-blue/40 transition-all duration-300 min-h-[180px]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Users className="absolute -bottom-6 -right-6 h-24 w-24 text-accent-cyan/10 pointer-events-none transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
              <div className="relative flex h-full flex-col justify-end pr-10 sm:pr-12">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-gradient-brand bg-clip-text font-mono mb-1 relative z-10">
                  {totalParticipants || 0}+
                </div>
                <div className="text-[10px] md:text-[11px] font-semibold text-text-secondary uppercase tracking-[0.14em] md:tracking-[0.18em] leading-tight relative z-10">
                  Total Participants
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border-default/60 bg-bg-surface/70 backdrop-blur-sm p-5 sm:p-6 shadow-lg shadow-black/10 hover:border-primary-blue/40 transition-all duration-300 min-h-[180px]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Target className="absolute -bottom-6 -right-6 h-24 w-24 text-success/10 pointer-events-none transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
              <div className="relative flex h-full flex-col justify-end pr-10 sm:pr-12">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-gradient-brand bg-clip-text font-mono mb-1 relative z-10">
                  {totalSubmissions || 0}
                </div>
                <div className="text-[10px] md:text-[11px] font-semibold text-text-secondary uppercase tracking-[0.14em] md:tracking-[0.18em] leading-tight relative z-10">
                  Total Submissions
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border-default/60 bg-bg-surface/70 backdrop-blur-sm p-5 sm:p-6 shadow-lg shadow-black/10 hover:border-primary-blue/40 transition-all duration-300 min-h-[180px]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Clock className="absolute -bottom-6 -right-6 h-24 w-24 text-warning/10 pointer-events-none transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
              <div className="relative flex h-full flex-col justify-end pr-10 sm:pr-12">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-gradient-brand bg-clip-text font-mono mb-1 relative z-10">
                  &lt;1s
                </div>
                <div className="text-[10px] md:text-[11px] font-semibold text-text-secondary uppercase tracking-[0.14em] md:tracking-[0.18em] leading-tight relative z-10">
                  Scoring Speed
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

      {/* What We Provide Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">What we provide</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Core features that make our platform powerful and easy to use
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="group relative overflow-hidden rounded-2xl border border-border-default/50 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_45%),linear-gradient(180deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))] p-6 min-h-[220px] shadow-lg shadow-black/10">
              <Trophy className="absolute right-4 top-4 h-24 w-24 text-primary-blue/10 transition-transform duration-300 group-hover:scale-110" />
              <div className="relative flex h-full flex-col justify-end pr-12">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-blue/80 mb-2">Competition</p>
                <h3 className="text-xl font-semibold text-text-primary mb-2">Professional Competitions</h3>
                <p className="text-sm leading-relaxed text-text-secondary">AI/ML competition system with multiple phases and international standards.</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border-default/50 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.10),transparent_45%),linear-gradient(180deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))] p-6 min-h-[220px] shadow-lg shadow-black/10">
              <Zap className="absolute right-4 top-4 h-24 w-24 text-accent-cyan/10 transition-transform duration-300 group-hover:scale-110" />
              <div className="relative flex h-full flex-col justify-end pr-12">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-cyan/80 mb-2">Scoring</p>
                <h3 className="text-xl font-semibold text-text-primary mb-2">Automatic Scoring</h3>
                <p className="text-sm leading-relaxed text-text-secondary">Automatic scoring system with F1 Score and instant feedback.</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border-default/50 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.10),transparent_45%),linear-gradient(180deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))] p-6 min-h-[220px] shadow-lg shadow-black/10">
              <Target className="absolute right-4 top-4 h-24 w-24 text-success/10 transition-transform duration-300 group-hover:scale-110" />
              <div className="relative flex h-full flex-col justify-end pr-12">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-success/80 mb-2">Leaderboard</p>
                <h3 className="text-xl font-semibold text-text-primary mb-2">Real-Time Leaderboards</h3>
                <p className="text-sm leading-relaxed text-text-secondary">Public and private leaderboards with real-time updates.</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border-default/50 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.10),transparent_45%),linear-gradient(180deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))] p-6 min-h-[220px] shadow-lg shadow-black/10">
              <Users className="absolute right-4 top-4 h-24 w-24 text-warning/10 transition-transform duration-300 group-hover:scale-110" />
              <div className="relative flex h-full flex-col justify-end pr-12">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-warning/80 mb-2">Collaboration</p>
                <h3 className="text-xl font-semibold text-text-primary mb-2">Team Competition</h3>
                <p className="text-sm leading-relaxed text-text-secondary">Support for individual and team competitions with member management.</p>
              </div>
            </div>
            </div>
        </div>
      </section>

      {/* Competition Format Section */}
      <section className="px-6 py-12 sm:py-16 bg-bg-elevated/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Competition Format</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Two flexible competition formats for different needs
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* 3-Phase Competition */}
            <Card className="p-8 bg-gradient-to-br from-primary-blue/5 to-transparent border-primary-blue/30 transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-1">3-Phase Competition</h3>
                  <p className="text-sm text-primary-blue font-semibold">For short-term competitions</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-registration/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-phase-registration font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-phase-registration">Registration</h4>
                    <p className="text-text-secondary text-sm">Participants register and prepare</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-public/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-phase-public font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-phase-public">Public Phase</h4>
                    <p className="text-text-secondary text-sm">Main competition with real-time leaderboard</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-ended/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-phase-ended font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-phase-ended">Ended</h4>
                    <p className="text-text-secondary text-sm">Results announced and rankings determined</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 4-Phase Competition */}
            <Card className="p-8 bg-gradient-to-br from-accent-cyan/5 to-transparent border-accent-cyan/30 transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-accent-cyan to-primary-blue rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">4</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-1">4-Phase Competition</h3>
                  <p className="text-sm text-accent-cyan font-semibold">For professional competitions</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-registration/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-phase-registration font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-phase-registration">Registration</h4>
                    <p className="text-text-secondary text-sm">Participants register and prepare</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-public/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-phase-public font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-phase-public">Public Test</h4>
                    <p className="text-text-secondary text-sm">Compete with public leaderboard</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-private/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-phase-private font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-phase-private">Private Test</h4>
                    <p className="text-text-secondary text-sm">Private leaderboard to prevent overfitting</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-ended/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-phase-ended font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-phase-ended">Ended</h4>
                    <p className="text-text-secondary text-sm">Final results based on private test scores</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA + Contact Section */}
      <section className="px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <Card className="relative overflow-hidden border-primary-blue/20 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_42%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_38%),linear-gradient(135deg,rgba(30,41,59,0.96),rgba(15,23,42,0.98))] p-8 sm:p-10 shadow-2xl shadow-primary-blue/10">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
            <div className="absolute -right-8 top-0 h-44 w-44 rounded-full bg-primary-blue/20 blur-3xl" />
            <div className="absolute -left-8 bottom-0 h-44 w-44 rounded-full bg-accent-cyan/15 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-stretch">
              <div className="flex h-full flex-col justify-between gap-8">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary-blue/20 bg-primary-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-cyan">
                    <Zap className="h-3.5 w-3.5" />
                    Join the next competition
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
                      Ready to compete at a higher level?
                    </h2>
                    <p className="max-w-2xl text-sm sm:text-base leading-7 text-text-secondary">
                      Join the community, test your ideas on real problems, and track your progress with structured competitions.
                    </p>
                  </div>
                  <div className="grid gap-3 text-sm text-text-secondary sm:grid-cols-2">
                    <div className="rounded-xl border border-border-default/70 bg-bg-primary/40 px-4 py-3 backdrop-blur-sm">
                      <span className="block font-semibold text-text-primary">Structured events</span>
                      Clear phases, transparent scoring, and clean leaderboards.
                    </div>
                    <div className="rounded-xl border border-border-default/70 bg-bg-primary/40 px-4 py-3 backdrop-blur-sm">
                      <span className="block font-semibold text-text-primary">Practical growth</span>
                      Build skills through challenges that reflect real workflows.
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href="/signup">
                    <Button variant="primary" size="lg" className="gap-2 rounded-full px-6 shadow-lg shadow-primary-blue/20">
                      <Zap className="w-5 h-5" />
                      Join now
                    </Button>
                  </Link>
                  <Link href="/competitions">
                    <Button variant="outline" size="lg" className="gap-2 rounded-full border-white/10 bg-white/5 px-6 backdrop-blur-sm hover:border-accent-cyan hover:text-accent-cyan">
                      <Trophy className="w-5 h-5" />
                      Explore competitions
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-accent-cyan/20 bg-bg-primary/35 p-6 backdrop-blur-sm">
                <div className="flex h-full flex-col justify-between gap-6">
                  <div className="space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/20 bg-accent-cyan/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-cyan">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" />
                      </svg>
                      Founder contact
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl sm:text-2xl font-bold text-text-primary leading-tight">Contact the founder directly</h3>
                      <p className="text-sm sm:text-base leading-7 text-text-secondary">
                        For partnership, support, or club-related questions, contact the founder of The Noders Community.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <a
                      href="mailto:phuckhangtdn@gmail.com"
                      className="group inline-flex w-full items-center justify-center gap-3 rounded-full border border-accent-cyan/30 bg-gradient-brand px-5 py-3 font-semibold text-white shadow-lg shadow-primary-blue/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent-cyan/20"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      phuckhangtdn@gmail.com
                    </a>
                    <div className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border-default bg-bg-elevated/70 px-4 py-2 text-sm text-text-secondary backdrop-blur-sm">
                      <span className="h-2 w-2 rounded-full bg-accent-cyan" />
                      Official website: thenodersptnk.com
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
