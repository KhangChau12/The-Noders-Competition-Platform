'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from './actions';
import { validatePassword } from '@/lib/utils/validation';
import { AuthField, PasswordField } from '@/components/auth/AuthFields';
import { AuthNotice } from '@/components/auth/AuthCard';
import { buttonClasses } from '@/components/ui/Button';

export default function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get('password') ?? '');
    const check = validatePassword(password);
    if (!check.valid) return setError(check.errors.join('. '));
    if (password !== fd.get('confirmPassword')) return setError('The two passwords don’t match.');

    setBusy(true);
    const res = await signUp(fd);
    if (res?.error) {
      setError(res.error);
      setBusy(false);
    } else if (res?.success) {
      router.push(`/verify-email?email=${encodeURIComponent(res.email || '')}`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && <AuthNotice tone="error">{error}</AuthNotice>}
      <AuthField label="Full name" name="fullName" autoComplete="name" required minLength={2} hint="Shown on leaderboards. Use your real name." autoFocus />
      <AuthField label="Email" name="email" type="email" autoComplete="email" required hint="Team invitations are sent to this address." />
      <PasswordField label="Password" name="password" autoComplete="new-password" required minLength={6} hint="At least 6 characters." />
      <PasswordField label="Confirm password" name="confirmPassword" autoComplete="new-password" required minLength={6} />
      <button type="submit" disabled={busy} className={buttonClasses({ variant: 'primary', size: 'lg', className: 'mt-1 w-full' })}>
        {busy ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-center text-sm text-text-muted">We’ll email you a link to confirm the address.</p>
    </form>
  );
}
