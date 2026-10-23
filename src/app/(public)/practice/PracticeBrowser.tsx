'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Crown } from 'lucide-react';
import type { PracticeSummary } from '@/lib/data/practice';
import { DOMAIN_UI, prettyTag, type Domain } from '@/lib/ui/phase';
import { metricShortName, metricArrow } from '@/lib/constants';
import { metricDecimals } from '@/lib/leaderboard';
import { cn } from '@/lib/utils/cn';

const DOMAIN_ORDER: Domain[] = ['nlp', 'cv', 'tabular', 'other'];
const LEVELS = [
  { id: 'all', label: 'Any level' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
] as const;

const DOT: Record<Domain, string> = { nlp: 'bg-violet', cv: 'bg-amber', tabular: 'bg-teal', other: 'bg-text-muted' };

export default function PracticeBrowser({ problems, signedIn }: { problems: PracticeSummary[]; signedIn: boolean }) {
  const [domain, setDomain] = useState<Domain | 'all'>('all');
  const [level, setLevel] = useState<(typeof LEVELS)[number]['id']>('all');
  const [q, setQ] = useState('');

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return problems.filter(
      (p) =>
        (domain === 'all' || p.domain === domain) &&
        (level === 'all' || p.difficulty === level) &&
        (!s || `${p.title} ${p.description} ${p.tags.map((t) => t.name).join(' ')}`.toLowerCase().includes(s))
    );
  }, [problems, domain, level, q]);

  const presentDomains = DOMAIN_ORDER.filter((d) => problems.some((p) => p.domain === d));
  const groups = DOMAIN_ORDER.map((d) => ({ d, items: shown.filter((p) => p.domain === d) })).filter((g) => g.items.length > 0);
  const filtering = domain !== 'all' || level !== 'all' || q.trim() !== '';

  return (
    <>
      {/* Filters — wrap freely on narrow screens */}
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-7">
          <div role="group" aria-label="Domain" className="flex flex-wrap gap-2">
            <FilterChip active={domain === 'all'} onClick={() => setDomain('all')} dot="bg-text-primary" count={problems.length}>
              All
            </FilterChip>
            {presentDomains.map((d) => (
              <FilterChip
                key={d}
                active={domain === d}
                onClick={() => setDomain(d)}
                dot={DOT[d]}
                count={problems.filter((p) => p.domain === d).length}
                activeBg={DOMAIN_UI[d].bg}
              >
                {DOMAIN_UI[d].label}
              </FilterChip>
            ))}
          </div>
          <div role="group" aria-label="Level" className="flex flex-wrap gap-x-5 text-sm">
            {LEVELS.map((l) => {
              const n = l.id === 'all' ? problems.length : problems.filter((p) => p.difficulty === l.id).length;
              const on = level === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={on}
                  disabled={n === 0}
                  onClick={() => setLevel(l.id)}
                  className={cn(
                    'min-h-[40px] font-medium decoration-teal decoration-2 underline-offset-8 disabled:cursor-not-allowed disabled:text-text-disabled',
                    on ? 'text-text-primary underline' : 'text-text-tertiary hover:text-text-primary'
                  )}
                >
                  {l.label}
                  {l.id !== 'all' && <span className="ml-1 font-mono text-xs opacity-70">{n}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <label className="relative block w-full lg:w-72">
          <span className="sr-only">Search problems</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search problems or libraries"
            className="min-h-[46px] w-full rounded-lg border border-border-subtle bg-bg-surface pl-10 pr-3.5 text-[15px] focus:border-blue focus:outline-none"
          />
        </label>
      </div>

      {/* Domain panels: a panel with several problems takes the full row; single-problem panels pair up on desktop. */}
      <div className="flex flex-wrap gap-5">
        {groups.map(({ d, items }) => {
          const ui = DOMAIN_UI[d];
          const full = items.length > 1 || groups.length === 1;
          return (
            <section data-reveal
              key={d}
              aria-label={ui.label}
              className={cn('flex w-full min-w-0 flex-col gap-4 rounded-[18px] p-5 sm:p-7', ui.bg, !full && 'lg:w-[calc(50%-10px)]')}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="h-card flex items-center gap-2.5">
                  <span className={cn('h-2.5 w-2.5 rounded-full', DOT[d])} aria-hidden />
                  {ui.label}
                </h2>
                <span className={cn('text-sm', ui.muted)}>
                  {items.length} problem{items.length > 1 ? 's' : ''}
                </span>
              </div>
              <div data-reveal-group className="grid flex-1 grid-cols-1 gap-3.5 md:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
                {items.map((p) => (
                  <ProblemCard key={p.id} p={p} signedIn={signedIn} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {shown.length === 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[18px] bg-bg-surface p-6">
          <span className="text-text-tertiary">No problem matches these filters.</span>
          <button
            type="button"
            onClick={() => {
              setDomain('all');
              setLevel('all');
              setQ('');
            }}
            className="min-h-[40px] font-semibold text-teal hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      <p className="mt-5 text-sm text-text-muted">
        {filtering ? `Showing ${shown.length} of ${problems.length} problems. ` : ''}↑ higher is better, ↓ lower is better.
      </p>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  dot,
  count,
  activeBg = 'bg-bg-raised',
  children,
}: {
  active: boolean;
  onClick: () => void;
  dot: string;
  count: number;
  activeBg?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition-colors',
        active ? cn(activeBg, 'border-white/25 text-white') : 'border-border-subtle text-text-tertiary hover:text-text-primary'
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', dot)} aria-hidden />
      {children}
      <span className="font-mono text-xs opacity-70">{count}</span>
    </button>
  );
}

function ProblemCard({ p, signedIn }: { p: PracticeSummary; signedIn: boolean }) {
  const ui = DOMAIN_UI[p.domain];
  const dec = metricDecimals(p.scoring_metric);
  const topic = p.tags.map((t) => prettyTag(t.name)).filter((t, i, a) => a.indexOf(t) === i).join(' · ');
  return (
    <Link href={`/practice/${p.id}`} className="lift group flex flex-col gap-3 rounded-2xl bg-black/30 p-5 text-text-primary">
      <span className="flex justify-between gap-3 text-[13px]">
        <span className={cn('min-w-0 truncate', ui.muted)}>{topic || ui.label}</span>
        {p.difficulty && <span className="shrink-0 font-semibold capitalize text-teal">{p.difficulty}</span>}
      </span>
      <span className="text-lg font-bold leading-snug tracking-[-0.01em] group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{p.title}</span>
      <span className="mt-auto grid grid-cols-3 gap-2">
        <Mini k="Metric" v={`${metricShortName(p.scoring_metric)} ${metricArrow(p.scoring_metric)}`} />
        <Mini k="Solvers" v={String(p.solvers)} mono />
        <Mini k="Top" v={p.topScore !== null ? p.topScore.toFixed(dec) : '—'} mono />
      </span>
      <span className="flex items-center justify-between gap-3 text-[13px]">
        <span className={cn('flex min-w-0 items-center gap-1.5', ui.muted)}>
          {p.topHolder && (
            <>
              <Crown className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
              <span className="truncate">{p.topHolder}</span>
            </>
          )}
        </span>
        <span className={cn('shrink-0 text-sm font-semibold', ui.text)}>
          {p.yourRank ? `You: #${p.yourRank}` : signedIn ? 'Start →' : 'Read →'}
        </span>
      </span>
    </Link>
  );
}

function Mini({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <span className="min-w-0 rounded-lg bg-white/[0.05] px-2.5 py-2">
      <span className="block text-[13px] text-text-muted">{k}</span>
      <span className={cn('block truncate text-sm', mono ? 'font-mono' : 'font-semibold')}>{v}</span>
    </span>
  );
}
