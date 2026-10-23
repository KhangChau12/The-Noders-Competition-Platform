'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { acceptTeamInvitation, rejectTeamInvitation } from '@/app/(user)/teams/invitations/actions';
import { cn } from '@/lib/utils/cn';

/**
 * Accept / Decline for one pending team invitation. After answering, it shows
 * a short confirmation in place and refreshes the server data.
 */
export default function InvitationActions({ invitationId, teamName, size = 'md' }: { invitationId: string; teamName: string; size?: 'sm' | 'md' }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const [done, setDone] = useState<'accepted' | 'declined' | null>(null);
  const [error, setError] = useState('');

  async function answer(kind: 'accept' | 'decline') {
    setBusy(kind);
    setError('');
    const res = kind === 'accept' ? await acceptTeamInvitation(invitationId) : await rejectTeamInvitation(invitationId);
    setBusy(null);
    if (res && 'error' in res && res.error) {
      setError(res.error);
      return;
    }
    setDone(kind === 'accept' ? 'accepted' : 'declined');
    router.refresh();
  }

  if (done) {
    return <p className={cn('font-semibold', done === 'accepted' ? 'text-teal' : 'text-text-tertiary')}>{done === 'accepted' ? `You joined ${teamName}.` : 'Invitation declined.'}</p>;
  }

  const h = size === 'sm' ? 'min-h-[40px] px-4 text-sm' : 'min-h-[44px] px-5 text-[15px]';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2.5">
        <button type="button" disabled={!!busy} onClick={() => answer('accept')} className={cn('rounded-lg bg-amber font-semibold text-amber-ink hover:bg-amber-soft disabled:opacity-60', h)}>
          {busy === 'accept' ? 'Joining…' : 'Accept'}
        </button>
        <button type="button" disabled={!!busy} onClick={() => answer('decline')} className={cn('rounded-lg border border-white/30 font-semibold hover:border-white/60 disabled:opacity-60', h)}>
          {busy === 'decline' ? 'Declining…' : 'Decline'}
        </button>
      </div>
      {error && <p className="text-sm text-amber-soft">{error}</p>}
    </div>
  );
}
