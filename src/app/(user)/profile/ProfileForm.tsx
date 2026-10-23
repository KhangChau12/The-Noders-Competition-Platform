'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from './actions';
import { Avatar } from '@/components/ui/Avatar';
import { buttonClasses } from '@/components/ui/Button';
import { FIELD_CLASS } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';

const field = cn(FIELD_CLASS, 'border-border-subtle');

/** Name + bio, with a live preview of how others see you. */
export default function ProfileForm({ name, bio, teamName, teamSize }: { name: string; bio: string; teamName: string | null; teamSize: number }) {
  const router = useRouter();
  const [n, setN] = useState(name);
  const [b, setB] = useState(bio);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = n.trim() !== name || b.trim() !== bio;
  const shown = n.trim() || 'Your name';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await updateProfile({ full_name: n, bio: b });
    setBusy(false);
    if ('error' in r) return setMsg({ ok: false, text: r.error });
    setMsg({ ok: true, text: 'Saved.' });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
      <form onSubmit={onSubmit} className="flex min-w-0 flex-1 flex-col gap-5 rounded-[18px] bg-bg-surface p-6 sm:p-8">
        <h2 className="h-card">How you appear</h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Full name</span>
          <input value={n} onChange={(e) => setN(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" className={field} />
          <span className="text-sm text-text-muted">Shown on leaderboards and team pages. Use your real name.</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-3 text-sm font-semibold">
            Bio
            <span className="font-mono text-xs font-normal text-text-muted">{b.length}/200</span>
          </span>
          <textarea value={b} onChange={(e) => setB(e.target.value)} maxLength={200} rows={3} placeholder="e.g. Grade 11, PTNK. Into NLP." className={cn(field, 'h-auto py-3')} />
          <span className="text-sm text-text-muted">Shown on team pages.</span>
        </label>
        <span className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy || !dirty || n.trim().length < 2} className={buttonClasses({ variant: 'primary' })}>
            {busy ? 'Saving…' : 'Save profile'}
          </button>
          {msg && (
            <span role="status" className={cn('text-sm', msg.ok ? 'text-teal' : 'text-amber')}>
              {msg.text}
            </span>
          )}
        </span>
      </form>

      <aside aria-label="Preview" className="flex w-full flex-col gap-3 lg:w-[380px] lg:shrink-0">
        <span className="text-[13px] font-semibold text-text-tertiary">Preview</span>
        <div className="rounded-2xl bg-blue-bg p-4">
          <span className="mb-2 block text-[13px] font-semibold text-blue">On a leaderboard</span>
          <div className="flex items-center gap-3 rounded-xl bg-black/25 px-3.5 py-3">
            <span className="w-7 font-mono text-sm text-text-muted">12</span>
            <Avatar name={shown} size={28} colorful />
            <span className="min-w-0 flex-1 truncate font-semibold">{shown}</span>
            <span className="font-mono text-sm">0.8412</span>
          </div>
        </div>
        <div className="rounded-2xl bg-amber-bg p-4">
          <span className="mb-2 block text-[13px] font-semibold text-amber">On a team page</span>
          <div className="flex flex-col gap-2 rounded-xl bg-black/25 p-4">
            <span className="flex items-center gap-3">
              <Avatar name={shown} size={40} colorful />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{shown}</span>
                <span className="block text-sm text-text-muted">{teamName ? `${teamName} · ${teamSize} member${teamSize === 1 ? '' : 's'}` : 'Member'}</span>
              </span>
            </span>
            {b.trim() ? <p className="line-clamp-2 text-sm text-text-tertiary">{b}</p> : <p className="text-sm italic text-text-disabled">No bio yet</p>}
          </div>
        </div>
      </aside>
    </div>
  );
}
