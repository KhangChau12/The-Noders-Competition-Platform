'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { updatePassword } from '@/app/(auth)/reset-password/actions';
import { validatePassword } from '@/lib/utils/validation';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check if we have valid reset token
  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('Invalid or expired reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    // Real-time validation
    const validation = validatePassword(value);
    setValidationErrors(validation.errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate password
    const validation = validatePassword(password);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      setIsLoading(false);
      return;
    }

    // Check passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('password', password);

    const result = await updatePassword(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setIsSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?message=Password updated successfully. Please login with your new password.');
      }, 2000);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="text-success text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-2">Password Updated!</h1>
          <p className="text-text-secondary mb-6">
            Your password has been successfully updated. Redirecting to login...
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-brand flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-display text-4xl mb-2 gradient-text">
            Set New Password
          </h1>
          <p className="text-text-secondary">
            Enter your new password below
          </p>
        </div>

        {error && (
          <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              New Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Enter new password"
              required
            />
            {validationErrors.length > 0 && (
              <div className="mt-2 text-xs text-error space-y-1">
                {validationErrors.map((err, idx) => (
                  <div key={idx}>• {err}</div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm New Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4 text-sm text-text-secondary">
            <div className="font-semibold mb-2">Password requirements:</div>
            <ul className="space-y-1">
              <li className={password.length >= 6 ? 'text-success' : ''}>
                • At least 6 characters
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading || validationErrors.length > 0}
          >
            {isLoading ? 'Updating...' : 'Update Password'}
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
