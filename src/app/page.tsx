import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import CompetitionCard from '@/components/competition/CompetitionCard';
import { createClient } from '@/lib/supabase/server';
import { getCompetitionPhase } from '@/lib/utils/competition';
import {
  Trophy,
  Users,
  Target,
  TrendingUp,
  Zap,
  Clock,
  ArrowRight,
  Code2,
} from 'lucide-react';

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch all competitions for preview
  const { data: allCompetitions } = await (supabase
    .from('competitions')
    .select(
      'id, title, description, competition_type, participation_type, registration_start, registration_end, public_test_start, public_test_end, private_test_start, private_test_end, scoring_metric'
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(6)) as { data: any[] | null };

  // Fetch statistics
  const { count: totalCompetitions } = await supabase
    .from('competitions')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null);

  // Fetch total unique participants from view (bypasses RLS)
  const { data: totalParticipantsData } = (await supabase
    .from('total_participants_count')
    .select('total_count')
    .single()) as { data: { total_count: number } | null };

  const totalParticipants = totalParticipantsData?.total_count || 0;

  const { count: totalSubmissions } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true });

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
      <section className="relative lg:min-h-[90vh] flex items-center overflow-hidden py-10 sm:py-16 lg:py-24">
        {/* Background: Blurred glow orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary-blue/20 rounded-full blur-[120px] pointer-events-none opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent-cyan/20 rounded-full blur-[120px] pointer-events-none opacity-60" />

        {/* Grid Background Overlay */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(51,65,85,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(51,65,85,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 lg:gap-8 items-center relative z-10">
          {/* Left Column - Typography & CTA */}
          <div className="text-center lg:text-left pt-2 sm:pt-4 lg:pt-0 mx-auto lg:mx-0 max-w-2xl">
            <h1 className="font-brand text-4xl sm:text-5xl lg:text-5xl leading-tight mb-4">
              <span className="text-text-primary block mb-1">
                The Noders
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-brand">
                Competition Platform
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg font-light text-text-secondary mb-5 leading-relaxed mx-auto lg:mx-0 max-w-xl">
              Join <span className="font-brand text-primary-blue">The Noders Community</span>. Challenge yourself with real-world AI competitions,
              compete fairly and learn from the best.
            </p>

            {/* Value Props */}
            <div className="flex items-center gap-4 justify-center lg:justify-start mb-5 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
                <span className="text-xs sm:text-sm">High-Quality Competitions</span>
              </span>
              <span className="text-border-subtle">&bull;</span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
                <span className="text-xs sm:text-sm">Professional Community</span>
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col xs:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/competitions" className="w-full xs:w-auto">
                <Button variant="primary" size="lg" className="gap-2 shadow-lg shadow-primary-blue/20 w-full xs:w-auto text-sm sm:text-base px-5 sm:px-6">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  View Competitions
                </Button>
              </Link>
              <Link href="/signup" className="w-full xs:w-auto">
                <Button variant="outline" size="lg" className="gap-2 backdrop-blur-sm bg-bg-primary/50 w-full xs:w-auto text-sm sm:text-base px-5 sm:px-6">
                  Sign Up Now
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
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
      <section className="px-4 sm:px-6 py-10 sm:py-14 bg-bg-surface/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-cyan mb-2">
              By the numbers
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Platform Statistics
            </h2>
            <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto">
              A quick snapshot of activity across the platform.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[
              { Icon: Trophy, value: `${totalCompetitions || 0}`, label: 'Competitions', color: 'text-primary-blue', bar: 'from-primary-blue to-accent-cyan' },
              { Icon: Users, value: `${totalParticipants || 0}+`, label: 'Participants', color: 'text-accent-cyan', bar: 'from-accent-cyan to-primary-blue' },
              { Icon: Target, value: `${totalSubmissions || 0}`, label: 'Submissions', color: 'text-success', bar: 'from-success to-accent-cyan' },
              { Icon: Clock, value: '<1s', label: 'Scoring Speed', color: 'text-warning', bar: 'from-warning to-primary-blue' },
            ].map(({ Icon, value, label, color, bar }) => (
              <div
                key={label}
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-border-default bg-bg-surface p-4 sm:p-5 hover:border-primary-blue/50 hover:shadow-lg hover:shadow-primary-blue/10 transition-all duration-300"
              >
                <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${bar} opacity-60`} />
                <Icon className={`absolute -bottom-3 -right-3 h-14 w-14 sm:h-20 sm:w-20 ${color} opacity-[0.12] rotate-[-8deg] pointer-events-none transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-14deg]`} />
                <div className="relative">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-gradient-brand bg-clip-text font-mono mb-1 tabular-nums">
                    {value}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.14em]">
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Competitions Preview */}
      {allCompetitions && allCompetitions.length > 0 && (
        <section className="px-4 sm:px-6 py-10 sm:py-14">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary mb-2 sm:mb-3">
                All Competitions
              </h2>
              <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto">
                Explore ongoing, upcoming, and completed competitions
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {allCompetitions?.map((competition) => (
                <CompetitionCard
                  key={competition.id}
                  competition={competition as any}
                  phase={getCompetitionPhase(competition)}
                />
              ))}
            </div>

            <div className="text-center mt-8 sm:mt-12">
              <Link href="/competitions">
                <Button variant="primary" size="lg" className="gap-2 text-sm sm:text-base px-5 sm:px-6">
                  Explore All
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* What We Provide Section */}
      <section className="px-4 sm:px-6 py-10 sm:py-14 bg-bg-surface/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-2 sm:mb-3">What we provide</h2>
            <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto">
              Core features that make our platform powerful and easy to use
            </p>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-border-default/50 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_45%),linear-gradient(180deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))] p-4 sm:p-5 lg:p-6 min-h-[160px] sm:min-h-[200px] shadow-lg shadow-black/10">
              <Trophy className="absolute right-3 top-3 h-14 w-14 sm:h-20 sm:w-20 text-primary-blue opacity-[0.10] transition-transform duration-300 group-hover:scale-110 pointer-events-none select-none" />
              <div className="relative flex h-full flex-col justify-end pr-8 sm:pr-12">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] sm:tracking-[0.18em] text-primary-blue/80 mb-1 sm:mb-2">Competition</p>
                <h3 className="text-sm sm:text-base lg:text-xl font-semibold text-text-primary mb-1 sm:mb-2 leading-snug">Professional Competitions</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-text-secondary hidden sm:block">AI/ML competition system with multiple phases and international standards.</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-border-default/50 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.10),transparent_45%),linear-gradient(180deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))] p-4 sm:p-5 lg:p-6 min-h-[160px] sm:min-h-[200px] shadow-lg shadow-black/10">
              <Zap className="absolute right-3 top-3 h-14 w-14 sm:h-20 sm:w-20 text-accent-cyan opacity-[0.10] transition-transform duration-300 group-hover:scale-110 pointer-events-none select-none" />
              <div className="relative flex h-full flex-col justify-end pr-8 sm:pr-12">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] sm:tracking-[0.18em] text-accent-cyan/80 mb-1 sm:mb-2">Scoring</p>
                <h3 className="text-sm sm:text-base lg:text-xl font-semibold text-text-primary mb-1 sm:mb-2 leading-snug">Automatic Scoring</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-text-secondary hidden sm:block">Automatic scoring system with F1 Score and instant feedback.</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-border-default/50 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.10),transparent_45%),linear-gradient(180deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))] p-4 sm:p-5 lg:p-6 min-h-[160px] sm:min-h-[200px] shadow-lg shadow-black/10">
              <Target className="absolute right-3 top-3 h-14 w-14 sm:h-20 sm:w-20 text-success opacity-[0.10] transition-transform duration-300 group-hover:scale-110 pointer-events-none select-none" />
              <div className="relative flex h-full flex-col justify-end pr-8 sm:pr-12">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] sm:tracking-[0.18em] text-success/80 mb-1 sm:mb-2">Leaderboard</p>
                <h3 className="text-sm sm:text-base lg:text-xl font-semibold text-text-primary mb-1 sm:mb-2 leading-snug">Real-Time Leaderboards</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-text-secondary hidden sm:block">Public and private leaderboards with real-time updates.</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-border-default/50 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.10),transparent_45%),linear-gradient(180deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))] p-4 sm:p-5 lg:p-6 min-h-[160px] sm:min-h-[200px] shadow-lg shadow-black/10">
              <Users className="absolute right-3 top-3 h-14 w-14 sm:h-20 sm:w-20 text-warning opacity-[0.10] transition-transform duration-300 group-hover:scale-110 pointer-events-none select-none" />
              <div className="relative flex h-full flex-col justify-end pr-8 sm:pr-12">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] sm:tracking-[0.18em] text-warning/80 mb-1 sm:mb-2">Collaboration</p>
                <h3 className="text-sm sm:text-base lg:text-xl font-semibold text-text-primary mb-1 sm:mb-2 leading-snug">Team Competition</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-text-secondary hidden sm:block">Support for individual and team competitions with member management.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Competition Format Section */}
      <section className="px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-2 sm:mb-3">Competition Format</h2>
            <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto">
              Two flexible competition formats for different needs
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            {[
              {
                number: '3',
                title: '3-Phase Competition',
                tagline: 'For short-term competitions',
                taglineColor: 'text-primary-blue',
                numberColor: 'text-primary-blue/[0.08]',
                glow: '[filter:drop-shadow(0_0_30px_rgba(37,99,235,0.35))]',
                steps: [
                  { label: 'Registration', text: 'Participants register and prepare', textColor: 'text-phase-registration', ringColor: 'ring-phase-registration/40' },
                  { label: 'Public Phase', text: 'Main competition with real-time leaderboard', textColor: 'text-phase-public', ringColor: 'ring-phase-public/40' },
                  { label: 'Ended', text: 'Results announced and rankings determined', textColor: 'text-phase-ended', ringColor: 'ring-phase-ended/40' },
                ],
              },
              {
                number: '4',
                title: '4-Phase Competition',
                tagline: 'For professional competitions',
                taglineColor: 'text-accent-cyan',
                numberColor: 'text-accent-cyan/[0.08]',
                glow: '[filter:drop-shadow(0_0_30px_rgba(6,182,212,0.35))]',
                steps: [
                  { label: 'Registration', text: 'Participants register and prepare', textColor: 'text-phase-registration', ringColor: 'ring-phase-registration/40' },
                  { label: 'Public Test', text: 'Compete with public leaderboard', textColor: 'text-phase-public', ringColor: 'ring-phase-public/40' },
                  { label: 'Private Test', text: 'Private leaderboard to prevent overfitting', textColor: 'text-phase-private', ringColor: 'ring-phase-private/40' },
                  { label: 'Ended', text: 'Final results based on private test scores', textColor: 'text-phase-ended', ringColor: 'ring-phase-ended/40' },
                ],
              },
            ].map((format) => (
              <Card
                key={format.number}
                className="relative overflow-hidden p-6 sm:p-8 hover:border-primary-blue/40 transition-all duration-300 hover:-translate-y-0"
              >
                <span
                  className={`absolute -bottom-12 -right-3 font-mono text-[10rem] font-bold leading-none ${format.numberColor} ${format.glow} rotate-[-10deg] pointer-events-none select-none`}
                  aria-hidden="true"
                >
                  {format.number}
                </span>

                <div className="relative mb-7">
                  <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-1">{format.title}</h3>
                  <p className={`text-sm font-semibold ${format.taglineColor}`}>{format.tagline}</p>
                </div>

                {/* Steps with connector line */}
                <div className="relative">
                  <div className="absolute left-4 top-4 bottom-4 w-px bg-border-default" aria-hidden="true" />
                  <div className="space-y-5">
                    {format.steps.map((step, index) => (
                      <div key={step.label} className="relative flex gap-4">
                        <div className={`relative w-8 h-8 rounded-full bg-bg-surface ring-1 ${step.ringColor} flex items-center justify-center flex-shrink-0`}>
                          <span className={`${step.textColor} font-bold text-sm`}>{index + 1}</span>
                        </div>
                        <div className="pt-0.5">
                          <h4 className={`font-semibold mb-0.5 ${step.textColor}`}>{step.label}</h4>
                          <p className="text-text-secondary text-sm leading-relaxed">{step.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA + Contact Section */}
      <section className="px-4 sm:px-6 py-10 sm:py-14 bg-bg-surface/40">
        <div className="max-w-6xl mx-auto">
          <Card className="relative overflow-hidden border-primary-blue/20 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_42%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_38%),linear-gradient(135deg,rgba(30,41,59,0.96),rgba(15,23,42,0.98))] p-5 sm:p-8 lg:p-10 shadow-2xl shadow-primary-blue/10">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
            <div className="absolute -right-8 top-0 h-44 w-44 rounded-full bg-primary-blue/20 blur-3xl" />
            <div className="absolute -left-8 bottom-0 h-44 w-44 rounded-full bg-accent-cyan/15 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-stretch">
              <div className="flex h-full flex-col justify-between gap-8">
                <div className="space-y-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-cyan">
                    Join the next competition
                  </p>
                  <div className="space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
                      Ready to compete at a higher level?
                    </h2>
                    <p className="max-w-2xl text-sm sm:text-base leading-7 text-text-secondary">
                      Join the community, test your ideas on real problems, and track your progress with structured competitions.
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-text-secondary">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent-cyan shrink-0" />
                      <span><span className="font-semibold text-text-primary">Structured events —</span> clear phases, transparent scoring, and clean leaderboards.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-blue shrink-0" />
                      <span><span className="font-semibold text-text-primary">Practical growth —</span> build skills through challenges that reflect real workflows.</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col xs:flex-row gap-3">
                  <Link href="/signup" className="w-full xs:w-auto">
                    <Button variant="primary" size="lg" className="gap-2 px-5 sm:px-6 w-full xs:w-auto text-sm sm:text-base shadow-lg shadow-primary-blue/20">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      Join now
                    </Button>
                  </Link>
                  <Link href="/competitions" className="w-full xs:w-auto">
                    <Button variant="outline" size="lg" className="gap-2 px-5 sm:px-6 w-full xs:w-auto text-sm sm:text-base hover:border-accent-cyan hover:text-accent-cyan">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      Explore competitions
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-6 border-t lg:border-t-0 lg:border-l border-border-default/30 pt-6 lg:pt-0 lg:pl-8">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-cyan">
                    Founder contact
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold text-text-primary leading-tight">Contact the founder directly</h3>
                  <p className="text-sm leading-6 text-text-secondary">
                    For partnership, support, or club-related questions, reach out to the founder of The Noders Community.
                  </p>
                </div>

                <div className="space-y-3">
                  <a
                    href="mailto:phuckhangtdn@gmail.com"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-primary-blue/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent-cyan/20 min-w-0"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">phuckhangtdn@gmail.com</span>
                  </a>
                  <p className="text-center text-sm text-text-tertiary">
                    Official website:{' '}
                    <a
                      href="https://thenodersptnk.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-cyan hover:underline"
                    >
                      thenodersptnk.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
