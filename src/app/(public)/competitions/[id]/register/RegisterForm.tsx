'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { Button, buttonClasses } from '@/components/ui/Button';
import { registerForCompetition } from './actions';
import { cn } from '@/lib/utils/cn';

export interface TeamOption {
  id: string;
  name: string;
  size: number;
  isLeader: boolean;
  eligible: boolean;
  checks: { ok: boolean; text: string }[];
}

interface Props {
  competitionId: string;
  isTeam: boolean;
  teams: TeamOption[];
  minTeamSize?: number | null;
  maxTeamSize?: number | null;
  summary: { format: string; metric: string; perDay: string; publicTest: string };
}

export default function RegisterForm({ competitionId, isTeam, teams, summary }: Props) {
  const router = useRouter();
  const firstEligible = teams.find((t) => t.eligible)?.id ?? '';
  const [picked, setPicked] = useState(firstEligible);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [doneName, setDoneName] = useState<string | null>(null);

  const pickedTeam = teams.find((t) => t.id === picked);
  const can = agree && !busy && (!isTeam || !!pickedTeam?.eligible);

  async function submit() {
    setBusy(true);
    setError('');
    const res = await registerForCompetition(competitionId, isTeam ? picked : null);
    setBusy(false);
    if (res && 'error' in res && res.error) {
      setError(res.error);
      return;
    }
    setDoneName(isTeam ? pickedTeam?.name ?? 'Your team' : 'You');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {doneName ? (
          <div className="flex flex-col gap-4 rounded-[18px] bg-violet-bg p-6 sm:p-8">
            <span className="text-[13px] font-semibold text-violet">Registration sent</span>
            <h2 className="h-card">
              {doneName === 'You' ? "You're registered" : `${doneName} is registered`} and waiting for approval.
            </h2>
            <ol className="flex flex-col gap-2">
              {[
                ['01', 'text-violet', 'An organiser reviews it', 'The status shows on your dashboard and on the contest page.'],
                ['02', 'text-blue', 'Read the problem meanwhile', 'The dataset link appears on the contest page once you are approved.'],
                ['03', 'text-teal', 'Once approved, Submit appears', isTeam ? 'Any team member can submit; limits are shared.' : 'Upload a CSV during the public test.'],
              ].map(([n, c, t, b]) => (
                <li key={n} className="flex gap-4 rounded-xl bg-black/25 px-4 py-3">
                  <span className={cn('font-mono', c)}>{n}</span>
                  <span>
                    <span className="block font-semibold">{t}</span>
                    <span className="block text-sm text-violet-muted">{b}</span>
                  </span>
                </li>
              ))}
            </ol>
            <Link href={`/competitions/${competitionId}`} className={buttonClasses({ variant: 'accent', tone: 'violet', className: 'w-fit' })}>
              Back to the contest
            </Link>
          </div>
        ) : (
          <>
            {isTeam ? (
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 text-xl font-bold">Which team?</legend>
                {teams.length === 0 && (
                  <p className="rounded-2xl bg-amber-bg px-5 py-4 text-amber-soft">You&apos;re not in any team yet. Create one, then come back to register it.</p>
                )}
                {teams.map((t) => {
                  const on = picked === t.id && t.eligible;
                  return (
                    <label
                      key={t.id}
                      className={cn(
                        'flex cursor-pointer flex-col gap-3 rounded-2xl border-2 p-5 transition-colors',
                        on ? 'border-blue bg-blue-bg' : 'border-transparent bg-bg-surface',
                        !t.eligible && 'cursor-not-allowed opacity-80'
                      )}
                    >
                      <span className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                        <span className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="team"
                            value={t.id}
                            checked={on}
                            disabled={!t.eligible}
                            onChange={() => setPicked(t.id)}
                            className="h-5 w-5 accent-[#8DB1FF]"
                          />
                          <span>
                            <span className="block text-lg font-bold">{t.name}</span>
                            <span className="block text-sm text-text-tertiary">
                              {t.isLeader ? 'You lead' : 'Member'} · {t.size} member{t.size > 1 ? 's' : ''}
                            </span>
                          </span>
                        </span>
                        <span className={cn('rounded-md px-2.5 py-0.5 text-[13px] font-semibold', t.eligible ? 'bg-teal-bg text-teal' : 'bg-amber-bg text-amber')}>
                          {t.eligible ? 'Can register' : t.isLeader ? 'Not eligible' : 'Leader must register'}
                        </span>
                      </span>
                      <span className="grid grid-cols-1 gap-1.5 pl-8 md:grid-cols-3">
                        {t.checks.map((c) => (
                          <span key={c.text} className={cn('flex items-start gap-2 text-sm', c.ok ? 'text-teal-soft' : 'text-amber')}>
                            {c.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
                            {c.text}
                          </span>
                        ))}
                      </span>
                    </label>
                  );
                })}
                <Link href="/teams" className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-border-subtle px-5 py-4 text-text-primary hover:border-text-muted">
                  <span>
                    <span className="block font-semibold">Create a new team</span>
                    <span className="block text-sm text-text-muted">You&apos;ll lead it. Come back here to register it.</span>
                  </span>
                  <span className="font-semibold text-amber">Teams →</span>
                </Link>
              </fieldset>
            ) : (
              <div className="flex flex-col gap-2 rounded-2xl border-2 border-blue bg-blue-bg p-5">
                <span className="text-lg font-bold">You, individually</span>
                <span className="flex items-center gap-2 text-sm text-teal-soft">
                  <Check className="h-4 w-4" aria-hidden /> Not registered for this contest yet
                </span>
                <span className="text-sm text-blue-muted">
                  Your name on the leaderboard comes from your{' '}
                  <Link href="/profile" className="text-blue hover:underline">
                    profile
                  </Link>
                  .
                </span>
              </div>
            )}

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-bg-surface px-5 py-4 text-[15px]">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#B79CF0]" />
              <span>I&apos;ve read the problem and the contest settings.{isTeam ? ' My teammates know they are being registered.' : ''}</span>
            </label>

            {error && <p className="rounded-xl bg-amber-bg px-4 py-3 text-amber-soft">{error}</p>}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Button variant="accent" tone="violet" size="lg" onClick={submit} disabled={!can} loading={busy}>
                {isTeam ? (pickedTeam?.eligible ? `Register ${pickedTeam.name}` : 'Register team') : 'Register'}
              </Button>
              <span className="text-sm text-text-muted">{can ? 'An organiser reviews it next.' : agree ? 'Pick a team that can register.' : 'Tick the box to continue.'}</span>
            </div>
          </>
        )}
      </div>

      <aside className="flex w-full flex-col gap-4 lg:w-[340px] lg:shrink-0">
        <div className="rounded-[18px] bg-bg-surface p-5 sm:p-6">
          <p className="mb-3 text-[13px] font-semibold text-text-tertiary">What you&apos;re signing up for</p>
          <dl className="grid grid-cols-2 gap-2">
            <Tile c="bg-violet-bg text-violet" k="Format" v={summary.format} />
            <Tile c="bg-amber-bg text-amber" k="Metric" v={summary.metric} />
            <Tile c="bg-blue-bg text-blue" k="Per day" v={summary.perDay} />
            <Tile c="bg-blue-bg text-blue" k="Public test" v={summary.publicTest} />
          </dl>
          <Link href={`/competitions/${competitionId}#problem`} className="link mt-4 inline-block text-sm">
            Read the problem first →
          </Link>
        </div>
      </aside>
    </div>
  );
}

function Tile({ c, k, v }: { c: string; k: string; v: string }) {
  const [bg, text] = c.split(' ');
  return (
    <div className={cn('rounded-xl px-3 py-2.5', bg)}>
      <dt className={cn('text-[13px]', text)}>{k}</dt>
      <dd className="text-sm font-semibold">{v}</dd>
    </div>
  );
}
