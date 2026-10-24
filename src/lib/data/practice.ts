import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createPublicClient } from '@/lib/supabase/public';
import { higherIsBetter } from '@/lib/leaderboard';
import { domainFromTags, type Domain } from '@/lib/ui/phase';

export interface PracticeTagLite {
  id: string;
  name: string;
  slug: string;
}

export interface PracticeSummary {
  id: string;
  title: string;
  description: string;
  scoring_metric: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  daily_submission_limit: number;
  created_at: string;
  tags: PracticeTagLite[];
  domain: Domain;
  solvers: number;
  validSubmissions: number;
  topScore: number | null;
  topHolder: string | null;
  yourBest: number | null;
  yourRank: number | null;
}

export const PRACTICE_TAG = 'practice';

// Public practice data (same for every visitor), cached for 60s; the viewer's
// own standing is derived from it per request.
const practiceRaw = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [{ data: problems }, { data: counts }, { data: best }] = await Promise.all([
    supabase
      .from('practice_problems')
      .select('id, title, description, scoring_metric, difficulty, daily_submission_limit, created_at, practice_problem_tags(practice_tags(id, name, slug))')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('practice_problem_submission_counts').select('problem_id, participant_count, valid_submission_count'),
    supabase
      .from('practice_submissions')
      .select('problem_id, user_id, score, submitted_at, users(full_name)')
      .eq('is_best_score', true)
      .eq('validation_status', 'valid')
      .not('score', 'is', null),
    ]);
    return { problems: problems ?? [], counts: counts ?? [], best: best ?? [] };
  },
  ['practice-summaries-v1'],
  { revalidate: 60, tags: [PRACTICE_TAG] }
);

/** Every live practice problem, with board stats and (optionally) the viewer's standing. */
export async function getPracticeSummaries(_supabase?: SupabaseClient, userId?: string | null): Promise<PracticeSummary[]> {
  const { problems, counts, best } = await practiceRaw();

  const countMap = new Map<string, { participant_count: number; valid_submission_count: number }>();
  for (const c of (counts ?? []) as { problem_id: string; participant_count: number; valid_submission_count: number }[]) {
    countMap.set(c.problem_id, c);
  }

  type BestRow = { problem_id: string; user_id: string; score: number; submitted_at: string; users: { full_name: string | null } | { full_name: string | null }[] | null };
  const byProblem = new Map<string, BestRow[]>();
  for (const r of (best ?? []) as BestRow[]) {
    const arr = byProblem.get(r.problem_id) ?? [];
    arr.push(r);
    byProblem.set(r.problem_id, arr);
  }

  return ((problems ?? []) as any[]).map((p) => {
    const tags: PracticeTagLite[] = (p.practice_problem_tags ?? []).map((pt: any) => pt.practice_tags).filter(Boolean);
    const entries = (byProblem.get(p.id) ?? []).slice();
    const hib = higherIsBetter(p.scoring_metric);
    entries.sort((a, b) => (a.score === b.score ? a.submitted_at.localeCompare(b.submitted_at) : hib ? b.score - a.score : a.score - b.score));
    const top = entries[0];
    const holder = top ? (Array.isArray(top.users) ? top.users[0]?.full_name : top.users?.full_name) ?? null : null;
    const yourIdx = userId ? entries.findIndex((e) => e.user_id === userId) : -1;
    const c = countMap.get(p.id);

    return {
      id: p.id,
      title: p.title,
      description: p.description ?? '',
      scoring_metric: p.scoring_metric,
      difficulty: p.difficulty,
      daily_submission_limit: p.daily_submission_limit,
      created_at: p.created_at,
      tags,
      domain: domainFromTags(tags),
      solvers: c?.participant_count ?? entries.length,
      validSubmissions: c?.valid_submission_count ?? 0,
      topScore: top?.score ?? null,
      topHolder: holder,
      yourBest: yourIdx >= 0 ? entries[yourIdx].score : null,
      yourRank: yourIdx >= 0 ? yourIdx + 1 : null,
    };
  });
}

/** One practice problem by id (cached; shared by generateMetadata and the page). */
export const getPracticeProblem = cache((id: string) =>
  unstable_cache(
    async () => {
      const { data } = await createPublicClient()
        .from('practice_problems')
        .select('id, title, description, problem_statement, scoring_metric, dataset_url, sample_submission_url, daily_submission_limit, total_submission_limit, max_file_size_mb, difficulty, practice_problem_tags(practice_tags(id, name, slug))')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();
      return data as Record<string, any> | null;
    },
    ['practice-by-id-v1', id],
    { revalidate: 60, tags: [PRACTICE_TAG] }
  )()
);

/** Top-100 board (best valid score per person) and counts for one problem, cached for 60s. */
export function getPracticeBoard(id: string, higherBetter: boolean) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const [{ data }, { data: counts }] = await Promise.all([
        supabase
          .from('practice_submissions')
          .select('user_id, score, submitted_at, users(full_name)')
          .eq('problem_id', id)
          .eq('is_best_score', true)
          .eq('validation_status', 'valid')
          .not('score', 'is', null)
          .order('score', { ascending: !higherBetter })
          .order('submitted_at', { ascending: true })
          .limit(100),
        supabase.from('practice_problem_submission_counts').select('participant_count, valid_submission_count').eq('problem_id', id).maybeSingle(),
      ]);
      return { rows: (data ?? []) as any[], counts: counts as { participant_count: number; valid_submission_count: number } | null };
    },
    ['practice-board-v1', id, String(higherBetter)],
    { revalidate: 60, tags: [PRACTICE_TAG] }
  )();
}
