'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { updatePassword } from '@/app/(auth)/reset-password/actions';
import { validatePassword } from '@/lib/utils/validation';
import { AuthCard, AuthNotice } from '@/components/auth/AuthCard';
import { PasswordField } from '@/components/auth/AuthFields';
import { buttonClasses } from '@/components/ui/Button';

/**
 * Landing page of the reset email. The callback route has already exchanged
 * the code for a session, so here we only need a signed-in user.
 */
export default function UpdatePasswordPage() {
  const router = useRouter();
  const [session, setSession] = useState<'checking' | 'ok' | 'none'>('checking');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setSession(data.user ? 'ok' : 'none'));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get('password') ?? '');
    const check = validatePassword(password);
    if (!check.valid) return setError(check.errors.join('. '));
    if (password !== fd.get('confirmPassword')) return setError('The two passwords don’t match.');

    setBusy(true);
    const res = await updatePassword(fd);
    setBusy(false);
    if (res?.error) return setError(res.error);
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 1500);
  }

  if (session === 'none') {
    return (
      <AuthCard eyebrow="Account" title="Link expired" sub="Reset links can be used once and expire after a short time.">
        <Link href="/reset-password" className={buttonClasses({ variant: 'primary', size: 'lg', className: 'w-full' })}>
          Send a new link
        </Link>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard eyebrow="Account" title="Password updated">
        <AuthNotice tone="info">You’re signed in. Taking you to your dashboard…</AuthNotice>
      </AuthCard>
    );
  }

  return (
    <AuthCard eyebrow="Account" title="Set a new password" sub="At least 6 characters.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error && <AuthNotice tone="error">{error}</AuthNotice>}
        <PasswordField label="New password" name="password" autoComplete="new-password" required minLength={6} autoFocus disabled={session !== 'ok'} />
        <PasswordField label="Confirm new password" name="confirmPassword" autoComplete="new-password" required minLength={6} disabled={session !== 'ok'} />
        <button type="submit" disabled={busy || session !== 'ok'} className={buttonClasses({ variant: 'primary', size: 'lg', className: 'mt-1 w-full' })}>
          {busy ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </AuthCard>
  );
}
