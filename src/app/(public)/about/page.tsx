import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Trophy, Users, Target, Award, Zap, Shield, Code2, Brain, Sparkles, Rocket, ChevronRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/10 via-accent-cyan/5 to-transparent" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center">
            {/* Main Title - Hero title: text-5xl md:text-7xl font-extrabold */}
            <h1 className="text-5xl md:text-7xl font-brand leading-tight mb-6">
              <span className="gradient-text">
                THE NODERS PTNK
              </span>
            </h1>

            {/* Subtitle - Hero subtitle: text-xl md:text-2xl font-light */}
            <p className="text-xl md:text-2xl font-light text-text-secondary mb-6 max-w-3xl mx-auto">
              Technology Community with students from PTNK
            </p>

            {/* Tagline */}
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-bg-elevated/80 backdrop-blur-sm rounded-full border border-border-default mb-8">
              <Sparkles className="w-5 h-5 text-primary-blue" />
              <span className="text-base md:text-lg font-semibold gradient-text tracking-wide">
                Connecting Minds • Creating Intelligence
              </span>
            </div>

            {/* Description - Large body text: text-lg */}
            <div className="max-w-3xl mx-auto mb-8 space-y-4">
              <p className="text-lg text-text-secondary leading-relaxed">
                Where innovation meets collaboration at VNUHCM High School for the Gifted.
                Just like nodes in a neural network collaborate to create powerful intelligence,
                we connect to build an outstanding developer community.
              </p>

              <p className="text-lg text-text-secondary leading-relaxed">
                This competition platform is created as a playground for our community -
                a place where members can challenge themselves, learn from each other,
                and grow together in AI & Machine Learning.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button variant="primary" size="lg" className="group">
                  Get Started
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/competitions">
                <Button variant="outline" size="lg">
                  Explore Competitions
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-blue/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl opacity-50" />
      </section>

      {/* What we provide */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            {/* Section heading: text-3xl md:text-4xl font-bold */}
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">What we provide</h2>
            {/* Section description: text-lg */}
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Core features that make our platform powerful and easy to use
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="group p-6 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-blue to-primary-blue/70 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              {/* Card title: text-xl font-semibold */}
              <h3 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-primary-blue transition-colors">
                Professional Competitions
              </h3>
              {/* Card description: text-sm */}
              <p className="text-sm text-text-secondary leading-relaxed">
                AI/ML competition system with multiple phases and international standards
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="group p-6 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-cyan to-accent-cyan/70 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-accent-cyan transition-colors">
                Automatic Scoring
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Automatic scoring system with F1 Score and instant feedback
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="group p-6 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-success to-success/70 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-success transition-colors">
                Real-Time Leaderboards
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Public and private leaderboards with real-time updates
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="group p-6 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning/70 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-warning transition-colors">
                Team Competition
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Support for individual and team competitions with member management
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="group p-6 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-error to-error/70 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-error transition-colors">
                High Security
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Security system with email verification and data encryption
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="group p-6 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-phase-registration to-phase-registration/70 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-phase-registration transition-colors">
                Detailed Analytics
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Dashboard with statistics and insights for participants
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Competition Format */}
      <section className="py-16 bg-bg-elevated/30">
        <div className="max-w-6xl mx-auto px-6">
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
                    <p className="text-text-secondary text-sm">
                      Participants register and prepare
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-public/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-phase-public font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-phase-public">Public Phase</h4>
                    <p className="text-text-secondary text-sm">
                      Main competition with real-time leaderboard
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-ended/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-phase-ended font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-phase-ended">Ended</h4>
                    <p className="text-text-secondary text-sm">
                      Results announced and rankings determined
                    </p>
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
                    <p className="text-text-secondary text-sm">
                      Participants register and prepare
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-public/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-phase-public font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-phase-public">Public Test</h4>
                    <p className="text-text-secondary text-sm">
                      Compete with public leaderboard
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-private/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-phase-private font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-phase-private">Private Test</h4>
                    <p className="text-text-secondary text-sm">
                      Private leaderboard to prevent overfitting
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-ended/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-phase-ended font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-phase-ended">Ended</h4>
                    <p className="text-text-secondary text-sm">
                      Final results based on private test scores
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">Contact Us</h2>
          <p className="text-base text-text-secondary mb-8">
            Have questions or need support? Contact us anytime
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="mailto:thenodersptnk@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-blue/30 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              thenodersptnk@gmail.com
            </a>

            <a
              href="https://thenodersptnk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-bg-surface border border-border-default text-text-primary font-semibold rounded-xl hover:border-primary-blue hover:bg-primary-blue/5 hover:text-primary-blue transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              thenodersptnk.com
            </a>
          </div>

          <p className="text-text-tertiary text-sm mt-6">
            Visit our website to learn more about The Noders PTNK
          </p>
        </div>
      </section>
    </div>
  );
}
