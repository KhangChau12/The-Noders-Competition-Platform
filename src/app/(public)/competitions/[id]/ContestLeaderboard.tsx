'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { rankFinal, rankPhase, higherIsBetter, metricDecimals } from '@/lib/leaderboard';
import { metricShortName } from '@/lib/constants';
import { cn } from '@/lib/utils/cn';
import Segmented from '@/components/ui/Segmented';

export interface LbRow {
  score: number | null;
  submitted_at: string;
  phase: string;
  user_id: string | null;
  team_id: string | null;
  submitted_by: string | null;
  user_name: string | null;
  team_name: string | null;
  submitter_name: string | null;
}

type Board = 'public' | 'private' | 'final';

interface Props {
  rows: LbRow[];
  metric: string;
  isTeam: boolean;
  fourPhase: boolean;
  privateStarted: boolean;
  ended: boolean;
  userId?: string | null;
  userTeamId?: string | null;
}

const MEDAL = ['bg-amber-strong text-gold', 'bg-[#252B36] text-silver', 'bg-[#2E2018] text-bronze'];
const PAGE = 50;

export default function ContestLeaderboard({ rows, metric, isTeam, fourPhase, privateStarted, ended, userId, userTeamId }: Props) {
  const boards: Board[] = ['public', ...(fourPhase && privateStarted ? (['private'] as Board[]) : []), ...(fourPhase && ended ? (['final'] as Board[]) : [])];
  const [board, setBoard] = useState<Board>(fourPhase && ended ? 'final' : fourPhase && privateStarted ? 'private' : 'public');
  const [entity, setEntity] = useState<'team' | 'individual'>(isTeam ? 'team' : 'individual');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const hib = higherIsBetter(metric);
  const dec = metricDecimals(metric);
  const byPerson = isTeam && entity === 'individual';

  const keyOf = (r: LbRow) => (isTeam ? (byPerson ? r.submitted_by : r.team_id) : r.user_id);
  const nameOf = (r: LbRow) => (isTeam ? (byPerson ? r.submitter_name ?? 'Member' : r.team_name ?? 'Team') : r.user_name ?? 'Participant');

  const ranked = useMemo(() => {
    if (board === 'final') {
      return rankFinal(rows, keyOf, hib).map((e) => ({
        key: e.key,
        rank: e.rank,
        name: nameOf(e.sample),
        team: byPerson ? e.sample.team_name : null,
        pub: e.publicScore,
        priv: e.privateScore,
        score: e.average,
        count: e.count,
      }));
    }
    return rankPhase(
      rows.filter((r) => r.phase === board),
      keyOf,
      hib
    ).map((e) => ({ key: e.key, rank: e.rank, name: nameOf(e.best), team: byPerson ? e.best.team_name : null, pub: null, priv: null, score: e.score as number | null, count: e.count }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, board, entity, hib]);

  const mineKey = byPerson || !isTeam ? userId : userTeamId;
  const mine = mineKey ? ranked.find((r) => r.key === mineKey) : undefined;

  const s = q.trim().toLowerCase();
  const filtered = s ? ranked.filter((r) => `${r.name} ${r.team ?? ''}`.toLowerCase().includes(s)) : ranked;
  const visible = filtered.slice(0, limit);

  const scores = ranked.map((r) => r.score).filter((v): v is number => v !== null);
  const bins = useMemo(() => histogram(scores, ranked.slice(0, 3).map((r) => r.score)), [scores.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const shakeUp = useMemo(() => {
    if (board !== 'final') return null;
    const both = ranked.filter((r) => r.pub !== null && r.priv !== null);
    if (both.length < 3) return null;
    const delta = (r: (typeof both)[number]) => (hib ? r.pub! - r.priv! : r.priv! - r.pub!); // positive = got worse
    const worst = both.reduce((a, b) => (delta(b) > delta(a) ? b : a));
    const steady = both.slice(0, Math.min(10, both.length)).reduce((a, b) => (Math.abs(delta(b)) < Math.abs(delta(a)) ? b : a));
    const allWorse = both.every((r) => delta(r) > 0);
    return { worst, steady, delta, allWorse };
  }, [ranked, board, hib]);

  const boardLabel: Record<Board, string> = { public: 'Public', private: 'Private', final: 'Final' };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {/* Table */}
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {isTeam && (
              <Segmented
                options={[
                  { id: 'team', label: 'Teams' },
                  { id: 'individual', label: 'Individuals' },
                ]}
                value={entity}
                onChange={(v) => {
                  setEntity(v as 'team' | 'individual');
                  setLimit(PAGE);
                }}
              />
            )}
            {boards.length > 1 && (
              <Segmented
                options={boards.map((b) => ({ id: b, label: boardLabel[b] }))}
                value={board}
                onChange={(v) => {
                  setBoard(v as Board);
                  setLimit(PAGE);
                }}
              />
            )}
          </div>
          <label className="relative block w-full sm:w-60">
            <span className="sr-only">Search the leaderboard</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={isTeam ? 'Search a name or team' : 'Search a name'}
              className="min-h-[42px] w-full rounded-lg border border-border-subtle bg-bg-surface pl-9 pr-3 text-sm focus:border-blue focus:outline-none"
            />
          </label>
        </div>

        <div className="overflow-hidden rounded-2xl bg-bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[15px]">
              <thead>
                <tr className="text-left text-[13px] text-text-muted">
                  <th scope="col" className="w-14 py-3.5 pl-4 font-medium sm:pl-6">#</th>
                  <th scope="col" className="px-3 py-3.5 font-medium">{byPerson ? 'Name · team' : isTeam ? 'Team' : 'Name'}</th>
                  {board === 'final' && (
                    <>
                      <th scope="col" className="px-3 py-3.5 text-right font-medium">Public</th>
                      <th scope="col" className="px-3 py-3.5 text-right font-medium">Private</th>
                    </>
                  )}
                  <th scope="col" className="px-3 py-3.5 text-right font-medium">{board === 'final' ? 'Final' : metricShortName(metric)}</th>
                  <th scope="col" className="py-3.5 pl-3 pr-4 text-right font-medium sm:pr-6">Subs</th>
                </tr>
              </thead>
              <tbody key={`${entity}-${board}`}>
                {visible.map((r) => {
                  const me = mine && r.key === mine.key;
                  return (
                    <tr key={r.key} className={cn('animate-fade-in border-t border-border-default', me ? 'bg-blue/[0.08]' : 'hover:bg-white/[0.025]')}>
                      <td className="py-2.5 pl-4 sm:pl-6">
                        <span className={cn('inline-flex h-[26px] min-w-[30px] items-center justify-center rounded-md font-mono text-[13px]', r.rank <= 3 ? MEDAL[r.rank - 1] : 'text-text-muted')}>
                          {String(r.rank).padStart(2, '0')}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold">{r.name}</span>
                        {me && <span className="ml-2 text-[13px] text-blue">you</span>}
                        {r.team && <span className="ml-2 text-sm text-text-muted">{r.team}</span>}
                      </td>
                      {board === 'final' && (
                        <>
                          <td className="px-3 py-2.5 text-right font-mono text-text-tertiary">{r.pub?.toFixed(dec) ?? '—'}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-text-tertiary">{r.priv?.toFixed(dec) ?? '—'}</td>
                        </>
                      )}
                      <td className="px-3 py-2.5 text-right font-mono">{r.score?.toFixed(dec) ?? '—'}</td>
                      <td className="py-2.5 pl-3 pr-4 text-right font-mono text-text-muted sm:pr-6">{r.count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="border-t border-border-default px-6 py-5 text-text-tertiary">{ranked.length === 0 ? 'No scores on this board yet.' : 'No match on this board.'}</p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-default px-4 py-3.5 text-[13px] text-text-muted sm:px-6">
            <span>
              {board === 'final'
                ? 'Ranked by the average of public and private scores; entries with both rank first.'
                : `Best valid ${board} score per ${byPerson ? 'person' : isTeam ? 'team' : 'person'}. Ties go to the earliest submission.`}
            </span>
            {filtered.length > limit && (
              <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="min-h-[36px] font-semibold text-blue hover:underline">
                Show more ({filtered.length - limit})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Side cards — under the table on phones */}
      <div className="flex w-full flex-col gap-4 lg:w-[300px] lg:shrink-0 lg:pt-[58px]">
        {mine && (
          <div className="rounded-2xl bg-blue-strong p-5">
            <p className="text-[13px] font-semibold text-blue">Your position</p>
            <p className="mt-1 font-mono text-[2rem] leading-none tracking-[-0.02em]">#{mine.rank}</p>
            <p className="mt-2 text-sm text-blue-muted">
              of {ranked.length} · {mine.score !== null ? <span className="font-mono text-white">{mine.score.toFixed(dec)}</span> : null}
            </p>
          </div>
        )}
        {scores.length >= 5 && (
          <figure className="rounded-2xl bg-blue-bg p-5">
            <figcaption className="mb-4 text-[13px] font-semibold text-blue">Where scores landed · {boardLabel[board].toLowerCase()}</figcaption>
            <div aria-hidden className="flex h-28 items-end gap-1.5">
              {bins.bars.map((b, i) => (
                <span key={i} className={cn('min-h-[3px] flex-1 rounded-t', b.top ? 'bg-blue' : 'bg-blue-line')} style={{ height: `${b.h}%` }} />
              ))}
            </div>
            <div aria-hidden className="mt-2 flex justify-between font-mono text-[11px] text-blue-muted">
              <span>{bins.lo.toFixed(2)}</span>
              <span>{bins.hi.toFixed(2)}</span>
            </div>
            <p className="mt-3 text-[13px] text-blue-muted">{hib ? 'Higher' : 'Lower'} is better. Brighter bars hold the top three.</p>
          </figure>
        )}
        {shakeUp && (
          <div className="rounded-2xl bg-amber-bg p-5">
            <p className="text-[13px] font-semibold text-amber">Public → private</p>
            <p className="mt-1.5 font-semibold leading-snug">
              {shakeUp.worst.name} lost {Math.abs(shakeUp.delta(shakeUp.worst)).toFixed(3)} between the rounds. {shakeUp.steady.name} held up best near the top (
              {Math.abs(shakeUp.delta(shakeUp.steady)).toFixed(3)}).
            </p>
            {shakeUp.allWorse && <p className="mt-1.5 text-[13px] text-amber-muted">Everyone on this board scored worse on the private set.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/** 8 equal bins across the central 90% of scores; outliers clamp into the end bins. */
function histogram(scores: number[], top: (number | null)[]) {
  if (scores.length === 0) return { bars: [], lo: 0, hi: 0 };
  const sorted = [...scores].sort((a, b) => a - b);
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))];
  const lo = q(0.05);
  const hi = q(0.95) === lo ? lo + 1e-9 : q(0.95);
  const n = 8;
  const counts = new Array(n).fill(0);
  const bin = (v: number) => Math.min(n - 1, Math.max(0, Math.floor(((v - lo) / (hi - lo)) * n)));
  for (const v of scores) counts[bin(v)]++;
  const topBins = new Set(top.filter((v): v is number => v !== null).map(bin));
  const max = Math.max(...counts, 1);
  return { bars: counts.map((c, i) => ({ h: Math.round((c / max) * 100), top: topBins.has(i) })), lo, hi };
}
