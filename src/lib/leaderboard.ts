import { SCORING_METRIC_INFO } from '@/lib/constants';

/**
 * Leaderboard maths, shared by server pages (podiums, previews) and the
 * client leaderboard tabs. Pure functions: callers fetch the rows.
 *
 * Rules (unchanged from the original CompetitionTabs logic):
 * - only valid submissions count;
 * - an entity's score in a phase is its best score in that phase;
 * - ties go to whoever reached that score first (earliest submitted_at);
 * - the final rank in a 4-phase contest averages best public and best private;
 *   entities with both scores rank above those with only one.
 */

export interface ScoredRow {
  score: number | null;
  submitted_at: string;
  phase: 'public' | 'private' | string;
}

export function higherIsBetter(metric: string): boolean {
  return SCORING_METRIC_INFO[metric as keyof typeof SCORING_METRIC_INFO]?.higher_is_better !== false;
}

export function metricDecimals(metric: string): number {
  return SCORING_METRIC_INFO[metric as keyof typeof SCORING_METRIC_INFO]?.decimals ?? 4;
}

function better(a: number, b: number, hib: boolean) {
  return hib ? a > b : a < b;
}

export interface PhaseEntry<R> {
  key: string;
  best: R;
  score: number;
  count: number;
  rank: number;
}

/** Best score per entity within one phase, ranked. */
export function rankPhase<R extends ScoredRow>(rows: R[], keyOf: (r: R) => string | null | undefined, hib: boolean): PhaseEntry<R>[] {
  const best = new Map<string, R>();
  const counts = new Map<string, number>();
  for (const r of rows) {
    const k = keyOf(r);
    if (!k || r.score === null || r.score === undefined) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
    const cur = best.get(k);
    if (!cur || better(r.score, cur.score!, hib) || (r.score === cur.score && r.submitted_at < cur.submitted_at)) {
      best.set(k, r);
    }
  }
  const list = Array.from(best.entries()).map(([key, r]) => ({ key, best: r, score: r.score as number, count: counts.get(key) ?? 0, rank: 0 }));
  list.sort((a, b) => (a.score === b.score ? a.best.submitted_at.localeCompare(b.best.submitted_at) : hib ? b.score - a.score : a.score - b.score));
  list.forEach((e, i) => (e.rank = i + 1));
  return list;
}

export interface FinalEntry<R> {
  key: string;
  sample: R;
  publicScore: number | null;
  privateScore: number | null;
  average: number | null;
  hasBoth: boolean;
  count: number;
  rank: number;
}

/** Final standings for a 4-phase contest (public + private averaged). */
export function rankFinal<R extends ScoredRow>(rows: R[], keyOf: (r: R) => string | null | undefined, hib: boolean): FinalEntry<R>[] {
  const map = new Map<string, FinalEntry<R> & { pubAt: string; privAt: string }>();
  for (const r of rows) {
    const k = keyOf(r);
    if (!k || r.score === null || r.score === undefined) continue;
    let e = map.get(k);
    if (!e) {
      e = { key: k, sample: r, publicScore: null, privateScore: null, average: null, hasBoth: false, count: 0, rank: 0, pubAt: '', privAt: '' };
      map.set(k, e);
    }
    e.count++;
    if (r.phase === 'public') {
      if (e.publicScore === null || better(r.score, e.publicScore, hib)) {
        e.publicScore = r.score;
        e.pubAt = r.submitted_at;
      }
    } else if (r.phase === 'private') {
      if (e.privateScore === null || better(r.score, e.privateScore, hib)) {
        e.privateScore = r.score;
        e.privAt = r.submitted_at;
      }
    }
  }
  const list = Array.from(map.values()).map((e) => {
    e.hasBoth = e.publicScore !== null && e.privateScore !== null;
    e.average = e.hasBoth ? (e.publicScore! + e.privateScore!) / 2 : null;
    return e;
  });
  const sortScore = (e: FinalEntry<R>) => e.average ?? e.publicScore ?? e.privateScore ?? (hib ? -Infinity : Infinity);
  list.sort((a, b) => {
    if (a.hasBoth !== b.hasBoth) return a.hasBoth ? -1 : 1;
    const sa = sortScore(a);
    const sb = sortScore(b);
    return hib ? sb - sa : sa - sb;
  });
  list.forEach((e, i) => (e.rank = i + 1));
  return list;
}

/** Final ranking for any contest: averaged for 4-phase, public-only for 3-phase. */
export function rankContest<R extends ScoredRow>(rows: R[], keyOf: (r: R) => string | null | undefined, metric: string, fourPhase: boolean) {
  const hib = higherIsBetter(metric);
  if (fourPhase) {
    return rankFinal(rows, keyOf, hib).map((e) => ({
      key: e.key,
      sample: e.sample,
      score: e.average ?? e.publicScore ?? e.privateScore,
      publicScore: e.publicScore,
      privateScore: e.privateScore,
      count: e.count,
      rank: e.rank,
    }));
  }
  return rankPhase(
    rows.filter((r) => r.phase === 'public'),
    keyOf,
    hib
  ).map((e) => ({ key: e.key, sample: e.best, score: e.score as number | null, publicScore: e.score as number | null, privateScore: null as number | null, count: e.count, rank: e.rank }));
}
