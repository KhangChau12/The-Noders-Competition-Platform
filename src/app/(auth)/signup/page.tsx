import Link from 'next/link';
import { AuthCard } from '@/components/auth/AuthCard';
import SignupForm from './SignupForm';

export const metadata = { title: 'Create an account – The Noders Platform' };

export default function SignupPage({ searchParams }: { searchParams: { redirect?: string } }) {
  const r = searchParams.redirect;
  const loginHref = r && r.startsWith('/') && !r.startsWith('//') ? `/login?redirect=${encodeURIComponent(r)}` : '/login';

  return (
    <AuthCard
      eyebrow="Account"
      title="Create an account"
      sub="Free for all students. Practice problems are open year-round."
      strip={
        <>
          <span>
            Already have an account?{' '}
            <Link href={loginHref} className="font-semibold text-blue hover:underline">
              Sign in
            </Link>
          </span>
          <span aria-hidden className="hidden text-text-disabled sm:inline">
            ·
          </span>
          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
