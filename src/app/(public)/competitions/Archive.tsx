'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { splitTitle, type PodiumEntry } from '@/lib/data/competitions';
import { metricShortName, metricArrow } from '@/lib/constants';
import { metricDecimals } from '@/lib/leaderboard';
import { vnDay } from '@/lib/ui/dates';
import { cn } from '@/lib/utils/cn';
import { plainText } from '@/lib/ui/text';
import { podiumName } from '@/lib/ui/text';

export interface ArchiveItem {
  id: string;
  title: string;
  description: string;
  endedAt: string;
  participation: 'team' | 'individual';
  fourPhase: boolean;
  metric: string;
  participants: number;
  submissions: number;
  podium: PodiumEntry[];
}

// Alternate tints so neighbouring cards read as separate contests.
const TINTS = [
  { bg: 'bg-blue-bg', accent: 'text-blue', muted: 'text-blue-muted', bars: ['bg-[#24345A] text-silver', 'bg-blue-line text-white', 'bg-[#1D2B4B] text-[#9FB0CF]'] },
  { bg: 'bg-teal-bg', accent: 'text-teal', muted: 'text-teal-muted', bars: ['bg-teal-strong text-[#C3E6D8]', 'bg-teal-line text-white', 'bg-[#183A30] text-teal-muted'] },
  { bg: 'bg-violet-bg', accent: 'text-violet', muted: 'text-violet-muted', bars: ['bg-violet-strong text-violet-soft', 'bg-violet-line text-white', 'bg-[#25213F] text-violet-muted'] },
];

export default function Archive({ items }: { items: ArchiveItem[] }) {
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((c) => `${c.title} ${c.description} ${c.podium.map((p) => p.name).join(' ')}`.toLowerCase().includes(s));
  }, [items, q]);

  return (
    <>
      {items.length > 2 && (
        <label className="relative mb-6 block max-w-sm">
          <span className="sr-only">Search past contests</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, task or winner"
            className="min-h-[46px] w-full rounded-lg border border-border-subtle bg-bg-surface pl-10 pr-3.5 text-[15px] focus:border-blue focus:outline-none"
          />
        </label>
      )}

      <div data-reveal-group className="flex flex-col gap-5">
        {shown.map((c, i) => {
          const tint = TINTS[i % TINTS.length];
          const { code, name } = splitTitle(c.title);
          const dec = metricDecimals(c.metric);
          const order = [c.podium[1], c.podium[0], c.podium[2]];
          const heights = ['h-[76px]', 'h-[112px]', 'h-[52px]'];
          return (
            <article
              key={c.id}
              className={cn('flex flex-col gap-8 rounded-[18px] p-6 sm:p-8 lg:items-stretch lg:gap-14 lg:p-10', tint.bg, i % 2 ? 'lg:flex-row-reverse' : 'lg:flex-row')}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className={cn('font-mono text-2xl leading-none tracking-[-0.02em]', tint.accent)}>
                    {new Date(c.endedAt).getFullYear()}
                  </span>
                  <span className={cn('text-sm', tint.muted)}>
                    {code ? `${code} · ` : ''}Ended {vnDay(c.endedAt)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold leading-[1.2] tracking-[-0.015em] sm:text-2xl">{name}</h3>
                  <p className="mt-2 line-clamp-2 max-w-[620px] text-text-secondary">{plainText(c.description)}</p>
                </div>
                <dl className="flex flex-wrap gap-2.5">
                  <Stat k="participants" v={c.participants} muted={tint.muted} />
                  <Stat k="submissions" v={c.submissions.toLocaleString('en-US')} muted={tint.muted} />
                  <Stat k="format" v={c.participation === 'team' ? 'Teams' : 'Solo'} muted={tint.muted} />
                  <Stat k="metric" v={`${metricShortName(c.metric)} ${metricArrow(c.metric)}`} muted={tint.muted} />
                </dl>
                <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 pt-1 text-[15px] font-semibold">
                  <Link href={`/competitions/${c.id}`} className={cn(tint.accent, 'hover:underline')}>
                    Full leaderboard &amp; problem →
                  </Link>
                  <Link href="/verify" className="text-text-primary hover:underline">
                    Verify a certificate
                  </Link>
                </div>
              </div>

              {c.podium.length >= 3 && (
                <div className="flex w-full flex-col rounded-2xl bg-black/25 px-5 pt-5 lg:w-[400px] lg:shrink-0">
                  <p className={cn('mb-4 text-[13px]', tint.muted)}>
                    {c.participation === 'team' ? 'Team podium' : 'Podium'} · {c.fourPhase ? 'average of public and private' : 'public score'}
                  </p>
                  <ol aria-label="Podium" className="mt-auto grid grid-cols-[1fr_1.2fr_1fr] items-end gap-2.5">
                    {order.map((p, k) => (
                      <li key={p.rank} className="flex min-w-0 flex-col gap-1.5">
                        <span title={p.name} className={cn(podiumName(p.name), 'leading-tight', k === 1 ? 'font-bold' : 'font-semibold')}>{p.name}</span>
                        <span className={cn('font-mono text-[13px]', tint.muted)}>{p.score?.toFixed(dec)}</span>
                        <span className={cn('rounded-t-[10px] px-3 py-2 font-mono text-sm', heights[k], tint.bars[k])}>{String(p.rank).padStart(2, '0')}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </article>
          );
        })}
        {shown.length === 0 && (
          <p className="rounded-2xl bg-bg-surface px-6 py-5 text-text-tertiary">No past contest matches “{q}”. Try a winner&apos;s name or a word from the task.</p>
        )}
      </div>
    </>
  );
}

function Stat({ k, v, muted }: { k: string; v: React.ReactNode; muted: string }) {
  return (
    <div className="flex flex-col-reverse rounded-xl bg-white/[0.05] px-4 py-2.5">
      <dt className={cn('text-[13px]', muted)}>{k}</dt>
      <dd className="font-mono text-lg">{v}</dd>
    </div>
  );
}
