import Link from 'next/link';
import { AuthCard } from '@/components/auth/AuthCard';
import { buttonClasses } from '@/components/ui/Button';

export const metadata = { title: 'Check your email – The Noders Platform' };

export default function VerifyEmailPage({ searchParams }: { searchParams: { email?: string } }) {
  const email = searchParams.email || '';

  return (
    <AuthCard
      eyebrow="Account"
      title="Confirm your email"
      sub={
        email ? (
          <>
            We sent a confirmation link to <span className="break-all font-semibold text-white">{email}</span>.
          </>
        ) : (
          'We sent you a confirmation link.'
        )
      }
      strip={
        <>
          <span>The link works for 24 hours.</span>
          <a href="mailto:phuckhangtdn@gmail.com" className="hover:text-white">
            Need help? Email us
          </a>
        </>
      }
    >
      <ol className="flex flex-col gap-2">
        {['Open the email from The Noders. Check spam or promotions if it isn’t there.', 'Click the confirmation link. It signs you in.', 'You land on your dashboard, with four short steps to get started.'].map((s, i) => (
          <li key={i} className="flex items-baseline gap-3 rounded-xl bg-bg-elevated px-4 py-3 text-[15px]">
            <span className="font-mono text-[13px] text-blue">{String(i + 1).padStart(2, '0')}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <Link href="/login" className={buttonClasses({ variant: 'primary', className: 'w-full sm:flex-1' })}>
          Go to sign in
        </Link>
        <Link href="/signup" className={buttonClasses({ variant: 'outline', className: 'w-full sm:flex-1' })}>
          Wrong email? Sign up again
        </Link>
      </div>
    </AuthCard>
  );
}
