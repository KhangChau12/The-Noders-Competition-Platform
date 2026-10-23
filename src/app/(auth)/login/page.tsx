import Link from 'next/link';
import { AuthCard } from '@/components/auth/AuthCard';
import LoginForm from './LoginForm';

export const metadata = { title: 'Sign in – The Noders Platform' };

const safe = (v: string | undefined) => (v && v.startsWith('/') && !v.startsWith('//') ? v : null);

export default function LoginPage({ searchParams }: { searchParams: { redirect?: string; error?: string; message?: string } }) {
  const redirectTo = safe(searchParams.redirect);
  const signupHref = redirectTo ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : '/signup';

  return (
    <AuthCard
      eyebrow="Account"
      title="Sign in"
      sub={redirectTo?.includes('/submit') ? 'Sign in to submit your predictions.' : redirectTo?.includes('/register') ? 'Sign in to register for this contest.' : 'Access your contests, submissions and teams.'}
      strip={
        <>
          <span>
            New here?{' '}
            <Link href={signupHref} className="font-semibold text-blue hover:underline">
              Create an account
            </Link>
          </span>
          <span aria-hidden className="hidden text-text-disabled sm:inline">
            ·
          </span>
          <Link href="/guide" className="hover:text-white">
            How the platform works
          </Link>
        </>
      }
    >
      <LoginForm redirectTo={redirectTo} error={searchParams.error ?? null} message={searchParams.message ?? null} />
    </AuthCard>
  );
}
