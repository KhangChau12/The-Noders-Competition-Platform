'use client';

import { useState } from 'react';
import { approveRegistration, rejectRegistration } from '../actions';
import { buttonClasses } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

/** Approve / Reject one registration. After a decision the row is greyed out until the page refreshes. */
export default function RegistrationActions({ registrationId }: { registrationId: string }) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null);
  const [error, setError] = useState('');

  async function decide(kind: 'approve' | 'reject') {
    setBusy(kind);
    setError('');
    const res = kind === 'approve' ? await approveRegistration(registrationId) : await rejectRegistration(registrationId);
    setBusy(null);
    if ('error' in res && res.error) return setError(res.error);
    setDone(kind === 'approve' ? 'approved' : 'rejected');
  }

  if (done) {
    return <span className={cn('text-sm font-semibold', done === 'approved' ? 'text-teal' : 'text-text-tertiary')}>{done === 'approved' ? 'Approved' : 'Rejected'}</span>;
  }

  return (
    <span className="flex flex-col gap-1.5 sm:items-end">
      <span className="flex gap-2">
        <button type="button" disabled={!!busy} onClick={() => decide('approve')} className={buttonClasses({ variant: 'accent', tone: 'teal', size: 'sm', className: 'flex-1 sm:flex-none' })}>
          {busy === 'approve' ? 'Approving…' : 'Approve'}
        </button>
        <button type="button" disabled={!!busy} onClick={() => decide('reject')} className={buttonClasses({ variant: 'outline', size: 'sm', className: 'flex-1 sm:flex-none' })}>
          {busy === 'reject' ? 'Rejecting…' : 'Reject'}
        </button>
      </span>
      {error && <span className="text-sm text-amber">{error}</span>}
    </span>
  );
}
