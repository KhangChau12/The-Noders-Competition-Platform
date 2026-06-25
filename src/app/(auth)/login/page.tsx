'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { signIn } from './actions';
import { Trophy } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  useEffect(() => {
    // Show message if redirected from somewhere
    const message = searchParams.get('message');
    if (message) {
      setError(message);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    // Add redirect parameter if exists
    if (redirectTo) {
      formData.append('redirect', redirectTo);
    }

    const result = await signIn(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // If success, redirect happens in server action
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-bg-primary via-bg-surface to-bg-primary">
      <Card className="relative w-full max-w-md p-6 sm:p-8 shadow-2xl overflow-hidden">
        <Trophy
          className="absolute -top-10 -right-10 h-40 w-40 text-primary-blue/[0.08] rotate-[12deg] pointer-events-none select-none [filter:drop-shadow(0_0_24px_rgba(37,99,235,0.35))]"
          aria-hidden="true"
        />
        <div className="relative text-center mb-8">
          <h1 className="font-brand text-3xl sm:text-4xl mb-3 gradient-text leading-tight">
            Welcome Back
          </h1>
          <p className="text-text-secondary">
            Sign in to continue competing
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative space-y-6">
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
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link
              href="/reset-password"
              className="text-primary-blue hover:text-accent-cyan transition-colors font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border-default text-center">
          <p className="text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="text-primary-blue hover:text-accent-cyan transition-colors font-bold"
            >
              Sign up now
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
