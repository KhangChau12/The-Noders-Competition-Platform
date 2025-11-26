import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Trophy, Users, Target, Award, Zap, Shield, Code2, Brain, Sparkles, Rocket, ChevronRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Modern gradient with animation */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/10 via-accent-cyan/5 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Animated badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-bg-elevated rounded-full border border-border-default mb-8 animate-fadeInDown">
              <Sparkles className="w-4 h-4 text-primary-blue" />
              <span className="text-sm font-semibold bg-gradient-brand bg-clip-text text-transparent">
                Vietnam's Leading AI Competition Platform
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fadeInUp">
              <span className="bg-gradient-brand bg-clip-text text-transparent">
                The Noders
              </span>
              <br />
              <span className="text-text-primary">
                Competition Platform
              </span>
            </h1>

            <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-8 animate-fadeInUp delay-100">
              AI & Machine Learning competition platform with automatic scoring system,
              real-time leaderboards and a fair, professional competitive environment
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeInUp delay-200">
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

      {/* Mission & Vision Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Mission */}
            <Card className="p-8 lg:p-10 bg-gradient-to-br from-primary-blue/5 to-transparent border-primary-blue/30 hover:border-primary-blue transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-brand rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary-blue/30">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">Mission</h2>
              <p className="text-text-secondary text-lg leading-relaxed">
                Build a fair, transparent and professional competitive environment
                to develop the AI/ML skills of the community. We believe everyone
                has the potential to become an AI expert with the right support and tools.
              </p>
            </Card>

            {/* Vision */}
            <Card className="p-8 lg:p-10 bg-gradient-to-br from-accent-cyan/5 to-transparent border-accent-cyan/30 hover:border-accent-cyan transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-r from-accent-cyan to-primary-blue rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-accent-cyan/30">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">Vision</h2>
              <p className="text-text-secondary text-lg leading-relaxed">
                Become Vietnam's leading AI competition platform, where young talents can
                challenge themselves, learn from the community and develop their careers in
                Artificial Intelligence and Machine Learning.
              </p>
            </Card>
          </div>

          {/* Core Values */}
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Core Values</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              The principles that guide how we build and operate the platform
            </p>
          </div>

          {/* Features Grid - Enhanced */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="group p-8 text-center hover:border-primary-blue hover:shadow-xl hover:shadow-primary-blue/20 transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-blue to-primary-blue/70 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-primary-blue/30">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary-blue transition-colors">
                Professional Competitions
              </h3>
              <p className="text-text-secondary leading-relaxed">
                AI/ML competition system with multiple phases, clear processes
                and international standards
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="group p-8 text-center hover:border-accent-cyan hover:shadow-xl hover:shadow-accent-cyan/20 transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-cyan to-accent-cyan/70 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-accent-cyan/30">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-accent-cyan transition-colors">
                Automatic Scoring
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Automatic scoring system with F1 Score, CSV file validation
                and instant feedback
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="group p-8 text-center hover:border-success hover:shadow-xl hover:shadow-success/20 transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-success to-success/70 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-success/30">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-success transition-colors">
                Real-Time Leaderboards
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Public and private leaderboards with anti-cheating mechanisms
                and real-time updates
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="group p-8 text-center hover:border-warning hover:shadow-xl hover:shadow-warning/20 transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-warning to-warning/70 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-warning/30">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-warning transition-colors">
                Team Competition
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Support for individual and team competitions with flexible
                and effective member management
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="group p-8 text-center hover:border-error hover:shadow-xl hover:shadow-error/20 transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-error to-error/70 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-error/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-error transition-colors">
                High Security
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Security system with email verification, user permissions
                and data encryption
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="group p-8 text-center hover:border-phase-registration hover:shadow-xl hover:shadow-phase-registration/20 transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-phase-registration to-phase-registration/70 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-phase-registration/30">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-phase-registration transition-colors">
                Detailed Analytics
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Detailed analytics dashboard with statistics, charts
                and insights for admins and participants
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Competition Format Explanation - New Section */}
      <section className="py-20 bg-bg-elevated/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Competition Format</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Platform supports two flexible competition formats suitable for all needs
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-20">
            {/* 3-Phase Competition */}
            <Card className="p-8 lg:p-10 bg-gradient-to-br from-primary-blue/5 to-transparent border-primary-blue/30 hover:border-primary-blue transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-blue/30">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">3-Phase Competition</h3>
                  <p className="text-sm text-primary-blue font-semibold">Suitable for short-term competitions</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-registration/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-phase-registration font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-phase-registration">Registration Phase</h4>
                    <p className="text-text-secondary text-sm">
                      Time for participants to register, understand the problem and prepare
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-public/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-phase-public font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-phase-public">Public Competition Phase</h4>
                    <p className="text-text-secondary text-sm">
                      Main competition time with real-time public leaderboard.
                      Participants submit predictions and receive scores instantly
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-ended/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-phase-ended font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-phase-ended">Ended</h4>
                    <p className="text-text-secondary text-sm">
                      Competition ends, results are announced and final rankings are determined
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 4-Phase Competition */}
            <Card className="p-8 lg:p-10 bg-gradient-to-br from-accent-cyan/5 to-transparent border-accent-cyan/30 hover:border-accent-cyan transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-accent-cyan to-primary-blue rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent-cyan/30">
                  <span className="text-white font-bold text-lg">4</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">4-Phase Competition</h3>
                  <p className="text-sm text-accent-cyan font-semibold">Suitable for professional competitions, prevents overfitting</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-registration/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-phase-registration font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-phase-registration">Registration Phase</h4>
                    <p className="text-text-secondary text-sm">
                      Time for participants to register, understand the problem and prepare
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-public/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-phase-public font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-phase-public">Public Test Phase</h4>
                    <p className="text-text-secondary text-sm">
                      Compete with public leaderboard. Participants submit and receive instant feedback
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-private/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-phase-private font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-phase-private">Private Test Phase</h4>
                    <p className="text-text-secondary text-sm">
                      Most important phase! Private leaderboard calculated on new dataset.
                      Scores are not public to prevent overfitting and evaluate generalization
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-phase-ended/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-phase-ended font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-phase-ended">Ended</h4>
                    <p className="text-text-secondary text-sm">
                      Private test results are announced, final rankings determined based on private test scores
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Stack - Modern design */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-bg-surface rounded-full border border-border-default mb-6">
              <Code2 className="w-4 h-4 text-primary-blue" />
              <span className="text-sm font-semibold text-text-secondary">
                Powered by modern technologies
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Technology Stack</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              We use the most modern technologies to ensure performance,
              security and the best user experience
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Next.js 14', desc: 'Frontend Framework', color: 'primary-blue' },
              { name: 'TypeScript', desc: 'Type Safety', color: 'accent-cyan' },
              { name: 'Supabase', desc: 'Backend & Database', color: 'success' },
              { name: 'Tailwind CSS', desc: 'Styling', color: 'phase-registration' }
            ].map((tech, index) => (
              <Card
                key={index}
                className="p-6 text-center hover:border-primary-blue hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 bg-${tech.color}/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-${tech.color}/20 transition-colors`}>
                  <Brain className={`w-6 h-6 text-${tech.color}`} />
                </div>
                <div className="font-mono font-bold text-text-primary mb-2 group-hover:text-primary-blue transition-colors">
                  {tech.name}
                </div>
                <p className="text-sm text-text-tertiary">{tech.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <Card className="relative overflow-hidden p-12 lg:p-16 text-center border-primary-blue/30 bg-gradient-to-br from-primary-blue/5 via-accent-cyan/5 to-transparent">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-brand" />

            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary-blue/50 animate-bounce">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Challenge Yourself?
              </h2>

              <p className="text-text-secondary text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                Join our AI/ML community today.
                Explore exciting competitions, compete with the best players
                and improve your skills
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button variant="primary" size="lg" className="group">
                    Sign Up Free
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/competitions">
                  <Button variant="outline" size="lg">
                    View Competitions
                  </Button>
                </Link>
              </div>
            </div>

            {/* Background decoration */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-blue/10 rounded-full blur-3xl" />
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent-cyan/10 rounded-full blur-3xl" />
          </Card>
        </div>
      </section>

      {/* Contact Section - Redesigned */}
      <section className="py-16 bg-bg-elevated/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">Contact Us</h2>
          <p className="text-text-secondary mb-8 text-lg">
            Have questions or need support? Don't hesitate to contact us
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* Email */}
            <a
              href="mailto:thenodersptnk@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-blue/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              thenodersptnk@gmail.com
            </a>

            {/* Website */}
            <a
              href="https://thenodersptnk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-bg-surface border border-border-default text-text-primary font-semibold rounded-xl hover:border-primary-blue hover:bg-primary-blue/5 hover:text-primary-blue transition-all duration-300 hover:-translate-y-0.5"
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
