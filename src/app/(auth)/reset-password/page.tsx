'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { resetPassword } from './actions';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('email', email);

    const result = await resetPassword(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setIsEmailSent(true);
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="text-success text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
          <p className="text-text-secondary mb-6">
            We&apos;ve sent password reset instructions to <strong>{email}</strong>
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="font-brand text-4xl mb-2 gradient-text">
            Reset Password
          </h1>
          <p className="text-text-secondary">
            Enter your email to receive reset instructions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-text-secondary">
          Remember your password?{' '}
          <Link
            href="/login"
            className="text-primary-blue hover:text-accent-cyan transition-colors font-medium"
          >
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
