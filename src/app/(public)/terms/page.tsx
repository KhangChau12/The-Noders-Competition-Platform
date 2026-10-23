import { Metadata } from 'next';
import { LegalPage, CONTACT } from '@/components/ui/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service | The Noders Platform',
  description: 'Terms of Service and usage policies for The Noders Competition Platform.',
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="25 June 2026"
      other={{ href: '/privacy', label: 'Privacy Policy' }}
      sections={[
        {
          title: 'Acceptance of Terms',
          body: <p>By accessing and using The Noders Competition Platform, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree, please do not use this service.</p>,
        },
        {
          title: 'Competition Conduct',
          body: (
            <>
              <p>When participating in competitions, you agree to:</p>
              <ul>
                <li>Submit only your own original work or your team&apos;s collective work</li>
                <li>Not attempt to game, probe, or reverse-engineer the scoring system</li>
                <li>Not create multiple accounts to bypass submission limits</li>
                <li>Respect submission limits and competition rules</li>
              </ul>
            </>
          ),
        },
        {
          title: 'User Content',
          body: <p>You retain ownership of the submissions you upload, but grant The Noders Platform a license to process, score, and display relevant results (such as leaderboard rankings) on the platform.</p>,
        },
        {
          title: 'Disclaimer',
          body: <p>The materials and services on The Noders Platform are provided on an &apos;as is&apos; basis. We make no warranties, expressed or implied, regarding availability, accuracy of scoring, or fitness for a particular purpose.</p>,
        },
        {
          title: 'Revisions',
          body: <p>The Noders Platform may revise these terms at any time without notice. By continuing to use this website you agree to be bound by the then-current version of these terms.</p>,
        },
        {
          title: 'Contact',
          body: <p>If you have any questions about these Terms of Service, please contact us at {CONTACT}.</p>,
        },
      ]}
    />
  );
}
