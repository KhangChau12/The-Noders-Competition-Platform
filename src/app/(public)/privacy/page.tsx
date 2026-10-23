import { Metadata } from 'next';
import { LegalPage, CONTACT } from '@/components/ui/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | The Noders Platform',
  description: 'Privacy Policy for The Noders Competition Platform.',
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="25 June 2026"
      other={{ href: '/terms', label: 'Terms of Service' }}
      sections={[
        {
          title: 'Information We Collect',
          body: (
            <>
              <p>We collect information you provide directly to us, such as when you create an account, register for a competition, submit solutions, or otherwise communicate with us.</p>
              <p>The types of information we may collect include your name, email address, and the submissions and team data you choose to provide.</p>
            </>
          ),
        },
        {
          title: 'How We Use Your Information',
          body: (
            <>
              <p>We use the information we collect to provide, maintain, and improve our services, including to:</p>
              <ul>
                <li>Process competition registrations and score submissions</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Monitor and analyze trends, usage, and activities on the platform</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Information Sharing',
          body: <p>We do not share your personal information with third parties except as described in this privacy policy or with your consent. Leaderboards display your display name and scores as part of competition participation.</p>,
        },
        {
          title: 'Contact Us',
          body: <p>If you have any questions about this Privacy Policy, please contact us at {CONTACT}.</p>,
        },
      ]}
    />
  );
}
