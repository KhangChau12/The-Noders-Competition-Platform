'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from './actions';
import { AuthField, PasswordField } from '@/components/auth/AuthFields';
import { AuthNotice } from '@/components/auth/AuthCard';
import { buttonClasses } from '@/components/ui/Button';

export default function LoginForm({ redirectTo, error: initialError, message }: { redirectTo: string | null; error: string | null; message: string | null }) {
  const [error, setError] = useState(initialError ?? '');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    if (redirectTo) fd.append('redirect', redirectTo);
    // On success the action redirects; we only get here on failure.
    const res = await signIn(fd);
    if (res?.error) {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {message && !error && <AuthNotice tone="info">{message}</AuthNotice>}
      {error && <AuthNotice tone="error">{error}</AuthNotice>}
      <AuthField label="Email" name="email" type="email" autoComplete="email" required autoFocus />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        required
        extra={
          <Link href="/reset-password" className="text-sm text-blue hover:underline">
            Forgot password?
          </Link>
        }
      />
      <button type="submit" disabled={busy} className={buttonClasses({ variant: 'primary', size: 'lg', className: 'mt-1 w-full' })}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
