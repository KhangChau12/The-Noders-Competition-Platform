'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from './actions';
import { AuthCard, AuthNotice } from '@/components/auth/AuthCard';
import { AuthField } from '@/components/auth/AuthFields';
import { buttonClasses } from '@/components/ui/Button';

export default function ResetPasswordPage() {
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await resetPassword(fd);
    setBusy(false);
    if (res?.error) return setError(res.error);
    setSentTo(String(fd.get('email') ?? ''));
  }

  const strip = (
    <span>
      Remember it?{' '}
      <Link href="/login" className="font-semibold text-blue hover:underline">
        Sign in
      </Link>
    </span>
  );

  if (sentTo) {
    return (
      <AuthCard
        eyebrow="Account"
        title="Reset link sent"
        sub={
          <>
            If <span className="break-all font-semibold text-white">{sentTo}</span> has an account, a reset link is on its way.
          </>
        }
        strip={strip}
      >
        <p className="text-[15px] text-text-secondary">Open the link on this device to set a new password. If it does not arrive within a few minutes, check your spam folder.</p>
        <button type="button" onClick={() => setSentTo('')} className={buttonClasses({ variant: 'outline', className: 'mt-5 w-full' })}>
          Use a different email
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard eyebrow="Account" title="Reset password" sub="Enter your account email to receive a reset link." strip={strip}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error && <AuthNotice tone="error">{error}</AuthNotice>}
        <AuthField label="Email" name="email" type="email" autoComplete="email" required autoFocus />
        <button type="submit" disabled={busy} className={buttonClasses({ variant: 'primary', size: 'lg', className: 'mt-1 w-full' })}>
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthCard>
  );
}
