import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Terms of Service | The Noders Platform',
  description: 'Terms of Service and usage policies for The Noders Competition Platform.',
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">Terms of Service</h1>
        <p className="text-text-secondary mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6">
          <Card padding="md">
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-text-secondary">
                By accessing and using The Noders Competition Platform, you accept and agree to be bound by
                the terms and provisions of this agreement. If you do not agree, please do not use this service.
              </p>
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>2. Competition Conduct</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-text-secondary mb-2">When participating in competitions, you agree to:</p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>Submit only your own original work or your team&apos;s collective work</li>
                <li>Not attempt to game, probe, or reverse-engineer the scoring system</li>
                <li>Not create multiple accounts to bypass submission limits</li>
                <li>Respect submission limits and competition rules</li>
              </ul>
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>3. User Content</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-text-secondary">
                You retain ownership of the submissions you upload, but grant The Noders Platform a license
                to process, score, and display relevant results (such as leaderboard rankings) on the platform.
              </p>
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>4. Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-text-secondary">
                The materials and services on The Noders Platform are provided on an &apos;as is&apos; basis.
                We make no warranties, expressed or implied, regarding availability, accuracy of scoring, or
                fitness for a particular purpose.
              </p>
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>5. Revisions</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-text-secondary">
                The Noders Platform may revise these terms at any time without notice. By continuing to use
                this website you agree to be bound by the then-current version of these terms.
              </p>
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>6. Contact</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-text-secondary">
                If you have any questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:phuckhangtdn@gmail.com" className="text-primary-blue hover:underline">
                  phuckhangtdn@gmail.com
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
