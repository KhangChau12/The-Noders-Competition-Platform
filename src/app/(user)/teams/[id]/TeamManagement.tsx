'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeTeamMember, updateTeam, deleteTeam } from './actions';
import { inviteUserToTeam, cancelTeamInvitation } from '../invitations/actions';
import { buttonClasses } from '@/components/ui/Button';
import { FIELD_CLASS } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';

type Result = { error?: string; success?: boolean; message?: string; redirect?: string } | undefined;
const errOf = (r: Result) => (r && 'error' in r && r.error ? r.error : null);
const field = cn(FIELD_CLASS, 'border-border-subtle');

/** Invite by the email the person signed up with. */
export function InviteCard({ teamId, full }: { teamId: string; full: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = (await inviteUserToTeam(teamId, email)) as Result;
    setBusy(false);
    const err = errOf(r);
    if (err) return setMsg({ ok: false, text: err });
    setMsg({ ok: true, text: r?.message ?? 'Invitation sent.' });
    setEmail('');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5 rounded-[18px] bg-blue-bg p-6">
      <span className="text-[13px] font-semibold text-blue">Invite a member</span>
      <p className="text-[15px] text-text-secondary">Enter the email address they registered with.</p>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" disabled={full} className={field} />
        </label>
        <button type="submit" disabled={busy || full || !email} className={buttonClasses({ variant: 'accent', tone: 'blue', className: 'min-h-[48px]' })}>
          {busy ? 'Sending…' : 'Send invitation'}
        </button>
      </div>
      {full && <p className="text-sm text-text-tertiary">The team is at the size limit of a contest it’s registered for.</p>}
      {msg && (
        <p role="status" className={cn('text-sm', msg.ok ? 'text-teal' : 'text-amber')}>
          {msg.text}
        </p>
      )}
    </form>
  );
}

/** Cancel a pending invitation (leader only). */
export function CancelInvite({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const err = errOf((await cancelTeamInvitation(invitationId)) as Result);
          setBusy(false);
          if (err) return setError(err);
          router.refresh();
        }}
        className="min-h-[40px] rounded-lg px-3 text-sm font-semibold text-amber hover:bg-white/[0.05] disabled:opacity-60"
      >
        {busy ? 'Cancelling…' : 'Cancel'}
      </button>
      {error && <span className="text-sm text-amber">{error}</span>}
    </span>
  );
}

/** Two-tap remove: first tap asks, second removes. */
export function RemoveMember({ teamId, userId, name }: { teamId: string; userId: string; name: string }) {
  const router = useRouter();
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!ask) {
    return (
      <button type="button" onClick={() => setAsk(true)} className="min-h-[40px] self-start text-sm text-text-tertiary hover:text-white">
        Remove from team
      </button>
    );
  }
  return (
    <span className="flex flex-col gap-1.5">
      <span className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const err = errOf((await removeTeamMember(teamId, userId)) as Result);
            setBusy(false);
            if (err) return setError(err);
            router.refresh();
          }}
          className={buttonClasses({ variant: 'danger', size: 'sm' })}
        >
          {busy ? 'Removing…' : `Remove ${name.split(/\s+/).pop()}`}
        </button>
        <button type="button" onClick={() => setAsk(false)} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
          Keep
        </button>
      </span>
      {error && <span className="text-sm text-amber">{error}</span>}
    </span>
  );
}

/** Name + description, editable by the leader. */
export function TeamDetailsForm({ teamId, name, description }: { teamId: string; name: string; description: string | null }) {
  const router = useRouter();
  const [n, setN] = useState(name);
  const [d, setD] = useState(description ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = n.trim() !== name || d.trim() !== (description ?? '');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const err = errOf((await updateTeam(teamId, { name: n, description: d })) as Result);
    setBusy(false);
    if (err) return setMsg({ ok: false, text: err });
    setMsg({ ok: true, text: 'Saved.' });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5 rounded-[18px] bg-bg-surface p-6">
      <h2 className="h-card">Team details</h2>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Name</span>
        <input value={n} onChange={(e) => setN(e.target.value)} required minLength={3} maxLength={50} className={field} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">About</span>
        <textarea value={d} onChange={(e) => setD(e.target.value)} maxLength={500} rows={3} className={cn(field, 'h-auto py-3')} />
      </label>
      <span className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy || !dirty} className={buttonClasses({ variant: 'secondary' })}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        {msg && (
          <span role="status" className={cn('text-sm', msg.ok ? 'text-teal' : 'text-amber')}>
            {msg.text}
          </span>
        )}
      </span>
    </form>
  );
}

/** Delete the team. Disabled while the team has a pending or approved registration. */
export function DeleteTeamCard({ teamId, teamName, blocked }: { teamId: string; teamName: string; blocked: boolean }) {
  const router = useRouter();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-error/30 p-6">
      <h2 className="h-card">Delete team</h2>
      {blocked ? (
        <p className="text-[15px] text-text-tertiary">Teams registered for a contest cannot be deleted.</p>
      ) : (
        <>
          <p className="text-[15px] text-text-tertiary">
            Removes the team and its members list. Type <span className="font-semibold text-text-primary">{teamName}</span> to confirm.
          </p>
          <label>
            <span className="sr-only">Team name</span>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} className={field} />
          </label>
          <button
            type="button"
            disabled={busy || typed.trim() !== teamName}
            onClick={async () => {
              setBusy(true);
              const err = errOf((await deleteTeam(teamId)) as Result);
              if (err) {
                setBusy(false);
                return setError(err);
              }
              router.push('/teams');
            }}
            className={buttonClasses({ variant: 'danger', className: 'self-start' })}
          >
            {busy ? 'Deleting…' : 'Delete team'}
          </button>
          {error && <p className="text-sm text-amber">{error}</p>}
        </>
      )}
    </div>
  );
}
