'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTeam } from '@/app/(user)/teams/create/actions';
import { buttonClasses } from '@/components/ui/Button';
import { FIELD_CLASS } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';

/**
 * Inline "create a team" form. With `collapsible`, it starts as a short card
 * with one button and opens the form in place. On success it opens the new team.
 */
export default function CreateTeamCard({ className, autoFocus, collapsible }: { className?: string; autoFocus?: boolean; collapsible?: boolean }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(!collapsible);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await createTeam(new FormData(e.currentTarget));
    if ('error' in res && res.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    if ('teamId' in res && res.teamId) router.push(`/teams/${res.teamId}`);
  }

  if (!expanded) {
    return (
      <div className={cn('flex flex-col gap-3 rounded-[18px] bg-blue-bg p-6', className)}>
        <span className="text-[13px] font-semibold text-blue">New team</span>
        <p className="text-[15px] text-text-secondary">Start a team and invite people by the email they signed up with.</p>
        <button type="button" onClick={() => setExpanded(true)} className={buttonClasses({ variant: 'accent', tone: 'blue', className: 'self-start' })}>
          Create a team
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn('flex animate-fade-up flex-col gap-3.5 rounded-[18px] bg-blue-bg p-6', className)}>
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold text-blue">New team</span>
        {collapsible && (
          <button type="button" onClick={() => setExpanded(false)} className="min-h-[32px] text-sm text-text-tertiary hover:text-white">
            Cancel
          </button>
        )}
      </span>
      <p className="text-[15px] text-text-secondary">You become the leader. Invite people by the email they signed up with.</p>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Team name</span>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={3}
          maxLength={50}
          autoFocus={autoFocus || collapsible}
          placeholder="e.g. Synapse"
          className={cn(FIELD_CLASS, 'border-border-subtle')}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">
          About <span className="font-normal text-text-muted">(optional)</span>
        </span>
        <textarea name="description" maxLength={500} rows={2} placeholder="One line about the team" className={cn(FIELD_CLASS, 'border-border-subtle h-auto min-h-[76px] py-3')} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-amber">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || name.trim().length < 3} className={buttonClasses({ variant: 'accent', tone: 'blue', className: 'self-start' })}>
        {busy ? 'Creating…' : 'Create team'}
      </button>
    </form>
  );
}
