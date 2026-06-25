import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Privacy Policy | The Noders Platform',
  description: 'Privacy Policy for The Noders Competition Platform.',
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">Privacy Policy</h1>
        <p className="text-text-secondary mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6">
          <Card padding="md">
            <CardHeader>
              <CardTitle>1. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-text-secondary">
                We collect information you provide directly to us, such as when you create an account,
                register for a competition, submit solutions, or otherwise communicate with us.
              </p>
              <p className="text-text-secondary mt-2">
                The types of information we may collect include your name, email address, and the
                submissions and team data you choose to provide.
              </p>
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>2. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-text-secondary">
                We use the information we collect to provide, maintain, and improve our services, including to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mt-2">
                <li>Process competition registrations and score submissions</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Monitor and analyze trends, usage, and activities on the platform</li>
              </ul>
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>3. Information Sharing</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-text-secondary">
                We do not share your personal information with third parties except as described in this
                privacy policy or with your consent. Leaderboards display your display name and scores
                as part of competition participation.
              </p>
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>4. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-text-secondary">
                If you have any questions about this Privacy Policy, please contact us at{' '}
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
