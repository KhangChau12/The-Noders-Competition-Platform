'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { signUp } from './actions';
import { validatePassword } from '@/lib/utils/validation';
import { Rocket } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordErrors(passwordValidation.errors);
      setError(passwordValidation.errors.join('. '));
      setIsLoading(false);
      return;
    }

    // Check passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const result = await signUp(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      // Redirect to verify-email page with email as query param
      router.push(`/verify-email?email=${encodeURIComponent(result.email || '')}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-bg-primary via-bg-surface to-bg-primary">
      <Card className="relative w-full max-w-md p-6 sm:p-8 shadow-2xl overflow-hidden">
        <Rocket
          className="absolute -top-10 -right-10 h-40 w-40 text-accent-cyan/[0.08] rotate-[12deg] pointer-events-none select-none [filter:drop-shadow(0_0_24px_rgba(6,182,212,0.35))]"
          aria-hidden="true"
        />
        <div className="relative text-center mb-8">
          <h1 className="font-brand text-3xl sm:text-4xl mb-3 gradient-text leading-tight">
            Join Now
          </h1>
          <p className="text-text-secondary">
            Create an account to start competing
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-success/10 border border-success rounded-lg text-success text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm font-semibold mb-2 text-text-primary">
              Full Name
            </label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="John Doe"
              required
              disabled={isLoading || !!success}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2 text-text-primary">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@example.com"
              required
              disabled={isLoading || !!success}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-2 text-text-primary">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimum 6 characters"
              required
              disabled={isLoading || !!success}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2 text-text-primary">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              required
              disabled={isLoading || !!success}
            />
          </div>

          {!success && (
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-6"
              loading={isLoading}
            >
              Create Account
            </Button>
          )}

          {success && (
            <Link href="/login">
              <Button variant="primary" size="lg" className="w-full mt-6">
                Go to Login
              </Button>
            </Link>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-border-default text-center">
          <p className="text-sm text-text-secondary">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary-blue hover:text-accent-cyan transition-colors font-bold"
            >
              Sign in now
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
